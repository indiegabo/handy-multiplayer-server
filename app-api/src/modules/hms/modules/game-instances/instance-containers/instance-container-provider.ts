import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { InstanceContainer } from "./instance-container";
import { GameInstance } from "../game-instance";

export interface InstanceContainerProvider {
    get canCreate(): boolean
    init(): Promise<boolean>
    dismiss(): Promise<boolean>
    all(): Promise<InstanceContainer[]>
    create(id: string, imageName: string, instance: GameInstance, environmentVariables?: string[]): Promise<InstanceContainer>
    destroy(id: string): Promise<boolean>
    start(id: string): Promise<boolean>
    stop(id: string): Promise<boolean>
    restart(id: string): Promise<boolean>
    setLogger(logger: BetterLogger): void

}