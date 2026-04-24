import { Provider } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InstanceContainerProvider } from "./instance-container-provider";
import { DockerodeContainerProvider } from "./providers/dockerode-container-provider.service";
import { KubernetesContainerProvider } from "./providers/kubernetes-container-provider.service";
import { InstanceContainerProviderType } from "./instance-container-provider-type";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { GAME_INSTANCES_CONFIG } from "@src/config/hms/game-instances.config";

/**
 * Name of the provider used to be used in service constructors injection.
 * e.g. `@Inject(InstanceProviderName) private containerProvider: InstanceContainerProvider`
 **/
export const INSTANCE_PROVIDER_NAME = 'InstanceDockerContainerProvider';

/**
 * Provides an instance of `InstanceContainerProvider` based on the configuration.
 * This is supposed to be cofigured as a provider in the InstanceContainersModule in order
 * to resolve the proper instance container provider based on the game instances configuration
 * file located at `src/config/game-instances.config.ts`.
 */
export const instanceContainerProvider: Provider = {
    provide: INSTANCE_PROVIDER_NAME,
    useFactory: async (
        moduleRef: ModuleRef,
    ): Promise<InstanceContainerProvider> => {
        // Retrieve the service type from the configuration, defaulting to 'dockerode'.
        const providerType = GAME_INSTANCES_CONFIG.defaultInstanceContainerProvider;
        let instanceContainerProvider: InstanceContainerProvider;
        const logger = new BetterLogger();

        // Determine which container provider to use based on the service type.
        switch (providerType.toLowerCase()) {
            case InstanceContainerProviderType.Dockerode:
                // Create an instance of DockerodeContainerProvider.
                instanceContainerProvider = await moduleRef.create(DockerodeContainerProvider);
                logger.setContext(DockerodeContainerProvider.name);
                break;
            case InstanceContainerProviderType.Kubernetes:
                // Create an instance of KubernetesContainerProvider.
                instanceContainerProvider = await moduleRef.create(KubernetesContainerProvider);
                logger.setContext(KubernetesContainerProvider.name);
                break;
            default:
                // Throw an error if the service type is unknown.
                throw new Error(`Unknown service type: ${providerType}`);
        }

        instanceContainerProvider.setLogger(logger);

        // Return the created instance container provider.
        return instanceContainerProvider;
    },
    inject: [ModuleRef],
};