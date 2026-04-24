import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { BetterLogger } from '../../better-logger/better-logger.service';
import { RedisService } from '../../redis/redis.service';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { StepResult, InitReport, InitStatus } from './types';

const INIT_STEPS_METADATA_KEY = 'init:steps';
const API_READY_KEY = 'api:ready';
const API_READY_CHANNEL = 'api:ready';
const MAINTENANCE_ACTIVE_KEY = 'maintenance:active';
const MAINTENANCE_CURRENT_ID_KEY = 'maintenance:current:id';
const MAINTENANCE_INIT_REPORT_PREFIX = 'maintenance:init-report:';
const MAINTENANCE_REPORT_TTL_SECONDS = 60 * 60 * 24 * 7;
const GAMES_RELEASE_STEP_NAME = 'Release games ready versions';
const GAMES_SUCCESS_HEADER = 'Successfully processed the following games:';
const GAMES_FAILED_HEADER = 'Failed to process the following games:';

// Define an internal type for a collected and executable step
interface ExecutableInitStep {
    name: string;
    priority: number;
    execute: () => Promise<StepResult>; // The bound function to execute
    serviceName: string; // Keep for reporting, but not for execution
}

interface MaintenanceInitReportState {
    maintenanceId: string;
    report: InitReport;
    updatedAt: string;
    updates: number;
}

type InitReportStep = InitReport['steps'][number];

interface ParsedGameEntries {
    successByGame: Map<string, string>;
    failedByGame: Map<string, string>;
    otherLines: string[];
    hasEntries: boolean;
}

@Injectable()
export class InitService {
    private readonly LOGS_DIRECTORY = resolve(process.cwd(), 'logs/init');
    private executableSteps: ExecutableInitStep[] = [];

    constructor(
        private readonly logger: BetterLogger,
        private readonly redisService: RedisService,
        private readonly discoveryService: DiscoveryService,
        private readonly metadataScanner: MetadataScanner,
    ) {
        this.logger.setContext(InitService.name);
        this.logger.setMessagesColor(BetterLogger.BRIGHT_BLUE);
    }

    private ensureLogsDirectoryExists(): void {
        if (!existsSync(this.LOGS_DIRECTORY)) {
            mkdirSync(this.LOGS_DIRECTORY, { recursive: true });
            this.logger.debug(`Created logs directory at: ${this.LOGS_DIRECTORY}`);
        }
    }

    private saveReportToFile(report: InitReport): string {
        this.ensureLogsDirectoryExists();
        const filename = `init-report-${new Date().toISOString()}.json`;
        const filePath = join(this.LOGS_DIRECTORY, filename);
        this.logger.debug(`Saving init report to: ${filePath}`);
        writeFileSync(filePath, JSON.stringify(report, null, 2));
        return filePath;
    }

    private getOverallStatus(stepResults: InitReport['steps']): InitStatus {
        if (stepResults.some((step) => step.status === 'failed')) return 'failed';
        if (stepResults.some((step) => step.status === 'partial')) return 'partial';
        return 'success';
    }

    private buildMaintenanceReportKey(maintenanceId: string): string {
        return `${MAINTENANCE_INIT_REPORT_PREFIX}${maintenanceId}`;
    }

    private statusWeight(status: InitStatus): number {
        switch (status) {
            case 'failed':
                return 3;
            case 'partial':
                return 2;
            default:
                return 1;
        }
    }

    private mostSevereStatus(a: InitStatus, b: InitStatus): InitStatus {
        return this.statusWeight(a) >= this.statusWeight(b) ? a : b;
    }

    private mergeUniqueLines(
        previous?: string,
        current?: string,
    ): string | undefined {
        if (!previous) return current;
        if (!current) return previous;

        const merged: string[] = [];
        const seen = new Set<string>();

        [...previous.split('\n'), ...current.split('\n')].forEach((line) => {
            const normalized = line.trim();

            if (!normalized) {
                if (merged.length === 0 || merged[merged.length - 1] === '') {
                    return;
                }

                merged.push('');
                return;
            }

            if (seen.has(normalized)) {
                return;
            }

            seen.add(normalized);
            merged.push(line);
        });

        return merged.join('\n').trim();
    }

    private extractGameName(entryLine: string): string {
        const trimmed = entryLine.replace(/^•\s*/, '').trim();

        if (trimmed.includes(' - ')) {
            return trimmed.split(' - ')[0].trim();
        }

        if (trimmed.includes(':')) {
            return trimmed.split(':')[0].trim();
        }

        return trimmed;
    }

    private parseGameEntries(message: string): ParsedGameEntries {
        const successByGame = new Map<string, string>();
        const failedByGame = new Map<string, string>();
        const otherLines: string[] = [];
        let section: 'success' | 'failed' | 'other' = 'other';

        message.split('\n').forEach((line) => {
            const trimmed = line.trim();

            if (!trimmed) {
                return;
            }

            if (trimmed === GAMES_SUCCESS_HEADER) {
                section = 'success';
                return;
            }

            if (trimmed === GAMES_FAILED_HEADER) {
                section = 'failed';
                return;
            }

            if (trimmed.startsWith('• ')) {
                const gameName = this.extractGameName(trimmed);

                if (section === 'failed') {
                    failedByGame.set(gameName, trimmed);
                    return;
                }

                if (section === 'success') {
                    successByGame.set(gameName, trimmed);
                    return;
                }
            }

            otherLines.push(line);
        });

        return {
            successByGame,
            failedByGame,
            otherLines,
            hasEntries:
                successByGame.size > 0 ||
                failedByGame.size > 0,
        };
    }

    private mergeGameReleaseMessages(
        previous?: string,
        current?: string,
    ): string | undefined {
        if (!previous) return current;
        if (!current) return previous;

        const previousParsed = this.parseGameEntries(previous);
        const currentParsed = this.parseGameEntries(current);

        if (!previousParsed.hasEntries && !currentParsed.hasEntries) {
            return this.mergeUniqueLines(previous, current);
        }

        const mergedSuccess = new Map(previousParsed.successByGame);
        const mergedFailed = new Map(previousParsed.failedByGame);

        currentParsed.successByGame.forEach((entry, game) => {
            mergedSuccess.set(game, entry);
        });

        currentParsed.failedByGame.forEach((entry, game) => {
            mergedFailed.set(game, entry);
        });

        const mergedParts: string[] = [];

        if (mergedSuccess.size > 0) {
            mergedParts.push(GAMES_SUCCESS_HEADER);
            mergedParts.push(...Array.from(mergedSuccess.values()));
        }

        if (mergedFailed.size > 0) {
            if (mergedParts.length > 0) {
                mergedParts.push('');
            }

            mergedParts.push(GAMES_FAILED_HEADER);
            mergedParts.push(...Array.from(mergedFailed.values()));
        }

        const mergedOtherLines = this.mergeUniqueLines(
            previousParsed.otherLines.join('\n'),
            currentParsed.otherLines.join('\n'),
        );

        if (mergedOtherLines) {
            if (mergedParts.length > 0) {
                mergedParts.push('');
            }

            mergedParts.push(mergedOtherLines);
        }

        return mergedParts.join('\n').trim();
    }

    private mergeStepMessages(
        previousStep: InitReportStep,
        currentStep: InitReportStep,
    ): string | undefined {
        if (currentStep.name === GAMES_RELEASE_STEP_NAME) {
            return this.mergeGameReleaseMessages(
                previousStep.message,
                currentStep.message,
            );
        }

        return this.mergeUniqueLines(previousStep.message, currentStep.message);
    }

    private mergeStep(
        previousStep: InitReportStep,
        currentStep: InitReportStep,
    ): InitReportStep {
        return {
            name: currentStep.name,
            service: currentStep.service,
            status: this.mostSevereStatus(
                previousStep.status,
                currentStep.status,
            ),
            duration: Math.max(previousStep.duration, currentStep.duration),
            message: this.mergeStepMessages(previousStep, currentStep),
        };
    }

    private mergeSteps(
        previousSteps: InitReportStep[],
        currentSteps: InitReportStep[],
    ): InitReportStep[] {
        const mergedByKey = new Map<string, InitReportStep>();

        previousSteps.forEach((step) => {
            const key = `${step.service}::${step.name}`;
            mergedByKey.set(key, { ...step });
        });

        currentSteps.forEach((step) => {
            const key = `${step.service}::${step.name}`;
            const previous = mergedByKey.get(key);

            if (!previous) {
                mergedByKey.set(key, { ...step });
                return;
            }

            mergedByKey.set(key, this.mergeStep(previous, step));
        });

        return Array.from(mergedByKey.values());
    }

    private earliestTimestamp(a: string, b: string): string {
        const aTs = Date.parse(a);
        const bTs = Date.parse(b);

        if (Number.isNaN(aTs)) return b;
        if (Number.isNaN(bTs)) return a;

        return aTs <= bTs ? a : b;
    }

    private mergeInitReports(
        previousReport: InitReport,
        currentReport: InitReport,
    ): InitReport {
        return {
            overallStatus: this.mostSevereStatus(
                previousReport.overallStatus,
                currentReport.overallStatus,
            ),
            steps: this.mergeSteps(previousReport.steps, currentReport.steps),
            timestamp: this.earliestTimestamp(
                previousReport.timestamp,
                currentReport.timestamp,
            ),
            duration: Math.max(previousReport.duration, currentReport.duration),
            maintenanceId:
                currentReport.maintenanceId ??
                previousReport.maintenanceId,
        };
    }

    private isMaintenanceState(
        payload: MaintenanceInitReportState | InitReport,
    ): payload is MaintenanceInitReportState {
        return (
            'report' in payload &&
            typeof payload.report === 'object' &&
            payload.report !== null
        );
    }

    private extractStoredMaintenanceReport(
        payload: MaintenanceInitReportState | InitReport | null,
        maintenanceId: string,
    ): { report: InitReport | null; updates: number } {
        if (!payload) {
            return { report: null, updates: 0 };
        }

        if (this.isMaintenanceState(payload)) {
            return {
                report: {
                    ...payload.report,
                    maintenanceId:
                        payload.report.maintenanceId ?? maintenanceId,
                },
                updates: payload.updates || 0,
            };
        }

        return {
            report: {
                ...payload,
                maintenanceId: payload.maintenanceId ?? maintenanceId,
            },
            updates: 0,
        };
    }

    private async persistMaintenanceScopedReport(
        report: InitReport,
    ): Promise<InitReport> {
        try {
            const isMaintenanceActive = await this.redisService.get(
                MAINTENANCE_ACTIVE_KEY,
            );

            if (isMaintenanceActive !== 'true') {
                return report;
            }

            const maintenanceId = await this.redisService.get(
                MAINTENANCE_CURRENT_ID_KEY,
            );

            if (!maintenanceId) {
                this.logger.warn(
                    'Maintenance is active but no maintenance id was found',
                );
                return report;
            }

            const scopedReport: InitReport = {
                ...report,
                maintenanceId,
            };

            const reportKey = this.buildMaintenanceReportKey(maintenanceId);
            const storedPayload = await this.redisService.getJson<
                MaintenanceInitReportState | InitReport
            >(reportKey);

            const { report: previousReport, updates } =
                this.extractStoredMaintenanceReport(
                    storedPayload,
                    maintenanceId,
                );

            const mergedReport = previousReport
                ? this.mergeInitReports(previousReport, scopedReport)
                : scopedReport;

            const state: MaintenanceInitReportState = {
                maintenanceId,
                report: mergedReport,
                updatedAt: new Date().toISOString(),
                updates: updates + 1,
            };

            await this.redisService.setJson(
                reportKey,
                state,
                MAINTENANCE_REPORT_TTL_SECONDS,
            );

            this.logger.debug(
                `Stored maintenance-scoped init report for ${maintenanceId}`,
            );

            return mergedReport;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.error(
                'Failed to persist maintenance-scoped init report: ' +
                `${errorMessage}`,
            );

            return report;
        }
    }

    private async publishApiReadiness(isReady: boolean): Promise<void> {
        const value = isReady ? 'true' : 'false';
        await this.redisService.set(API_READY_KEY, value);
        await this.redisService.publish(API_READY_CHANNEL, value);
    }

    private collectAndBindInitSteps(): ExecutableInitStep[] {
        const providers = this.discoveryService.getProviders();
        const collectedSteps: ExecutableInitStep[] = [];

        providers.forEach(wrapper => {
            const { instance } = wrapper;
            if (!instance || typeof instance !== 'object') {
                return;
            }

            const prototype = Object.getPrototypeOf(instance);
            const serviceName = instance.constructor.name; // Keep service name for reporting

            // Get metadata from the prototype of the instance
            const stepsMetadata = Reflect.getMetadata(INIT_STEPS_METADATA_KEY, prototype.constructor) || [];

            stepsMetadata.forEach((stepMeta: { methodName: string | symbol; name: string; priority: number }) => {
                const method = instance[stepMeta.methodName];

                if (typeof method === 'function') {
                    collectedSteps.push({
                        name: stepMeta.name,
                        priority: stepMeta.priority,
                        execute: method.bind(instance), // Crucial: Bind the method to its instance
                        serviceName: serviceName,
                    });
                } else {
                    this.logger.warn(`@InitStep applied to non-function property '${String(stepMeta.methodName)}' in service '${serviceName}'. Skipping.`);
                }
            });
        });

        // Sort by priority (highest first)
        return collectedSteps.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Initializes the application by executing all registered @InitStep methods.
     * This method will execute all collected steps in order of their priority (highest first).
     * If any step fails, the initialization process will break and return false.
     * If all steps succeed, the method will return true and save a report of the initialization process.
     * The report will be published to Redis as either 'api:init-success' or 'api:init-failed' depending on the outcome.
     *
     * @returns A promise that resolves to a boolean indicating whether the initialization was successful.
     */
    async init(): Promise<boolean> {
        // Collect all executable steps during module initialization
        this.executableSteps = this.collectAndBindInitSteps();
        this.logger.debug(`Discovered ${this.executableSteps.length} @InitStep methods.`);

        const startTime = Date.now();
        const stepResults: InitReport['steps'] = [];
        let hasFailure = false;

        this.logger.debug('Starting application initialization');
        const stepsToExecute = this.executableSteps; // Use the pre-collected and bound steps

        if (stepsToExecute.length === 0) {
            this.logger.warn('No @InitStep methods found to execute.');
            let report: InitReport = {
                overallStatus: 'success',
                steps: [],
                timestamp: new Date().toISOString(),
                duration: 0,
            };

            report = await this.persistMaintenanceScopedReport(report);

            const reportPath = this.saveReportToFile(report);
            this.logger.debug(`Initialization report saved to: ${reportPath}`);
            await this.publishApiReadiness(true);
            await this.redisService.publish('api:init-success', JSON.stringify(report));
            this.logger.debug('Application initialized successfully (no steps).');
            return true;
        }

        try {
            for (const { name, execute, serviceName } of stepsToExecute) { // Iterate over the pre-bound functions
                const stepStartTime = Date.now();
                this.logger.debug(`Executing step: ${name}`);

                try {
                    const result: StepResult = await execute(); // Execute the bound function
                    const duration = Date.now() - stepStartTime;

                    const stepResult = {
                        name: name,
                        status: result.status,
                        message: result.message,
                        duration,
                        service: serviceName, // Still useful for reporting context
                    };

                    stepResults.push(stepResult);

                    this.logger.debug(
                        `Step ${name} completed with status: ${result.status}` +
                        (result.message ? ` - ${result.message}` : ''),
                    );

                    if (result.status === 'failed') {
                        hasFailure = true;
                        break;
                    }
                } catch (error) {
                    const duration = Date.now() - stepStartTime;
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    stepResults.push({
                        name: name,
                        status: 'failed',
                        message: errorMessage,
                        duration,
                        service: serviceName,
                    });

                    this.logger.error(`Step ${name} failed: ${errorMessage}`);
                    hasFailure = true;
                    break;
                }
            }

            const overallDuration = Date.now() - startTime;
            const overallStatus = this.getOverallStatus(stepResults);

            let report: InitReport = {
                overallStatus,
                steps: stepResults,
                timestamp: new Date().toISOString(),
                duration: overallDuration,
            };

            report = await this.persistMaintenanceScopedReport(report);

            const reportPath = this.saveReportToFile(report);
            this.logger.debug(`Initialization report saved to: ${reportPath}`);

            if (hasFailure) {
                await this.publishApiReadiness(false);
                await this.redisService.publish('api:init-failed', JSON.stringify(report));
                this.logger.error('Application initialization failed');
                return false;
            }

            await this.publishApiReadiness(true);
            await this.redisService.publish('api:init-success', JSON.stringify(report));
            this.logger.debug('Application initialized successfully');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Initialization process failed: ${errorMessage}`);

            let report: InitReport = {
                overallStatus: 'failed',
                steps: stepResults,
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
            };

            report = await this.persistMaintenanceScopedReport(report);

            await this.publishApiReadiness(false);
            await this.redisService.publish('api:init-failed', JSON.stringify(report));
            return false;
        }
    }
}