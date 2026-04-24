import { Injectable } from "@nestjs/common";
import { InstanceContainerProvider } from "../instance-container-provider";
import { InstanceContainer } from "../instance-container";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";

@Injectable()
export class KubernetesContainerProvider implements InstanceContainerProvider {
    get canCreate(): boolean {
        return false;
    }

    init(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    dismiss(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    all(): Promise<InstanceContainer[]> {
        throw new Error("Method not implemented.");
    }

    create(id: string, imageName: string): Promise<InstanceContainer> {
        throw new Error("Method not implemented.");
    }

    destroy(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    start(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    stop(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    restart(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    setLogger(logger: BetterLogger): void {
        throw new Error("Method not implemented.");
    }
}