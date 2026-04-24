import { GameInstanceCreationPayload } from './payloads/game-instance-creation.payload';
import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { GameInstancesService } from './game-instances.service';
import { GameInstanceInfo, InstanceStatus } from './game-instance';
import { InstanceConnectivityData, JoinInstanceData } from '@src/testing/payloads';
import { GenericValidatorService } from '../generic-validations/generic-validator.service';
import { Validations } from '../generic-validations/generic-validations';
import { GameInstanceCreationFailedException } from './exceptions/game-instance-creation-failed.exception';
import { UserNotFoundException } from '../auth/exceptions/user-not-found.exception';
import { InvalidCredentialsException } from '../auth/exceptions/invalid-credentials.exception';
import { Request as AuthenticatedRequest } from 'express';
import { responser } from '@hms-module/core/utils/response.util';
import { UsersRepository } from '../users/repositories/users.repository';
import { AuthGuard } from '@hms-module/core/guards/auth.guard';
import { ApiResponse } from "@hms/shared-types/hms";
import { GAME_SERVER_BUILDS } from '@src/config/hms/dockerode.config';

@Controller('game-instances')
export class GameInstancesController {

    constructor(
        private readonly logger: BetterLogger,
        private readonly instancesService: GameInstancesService,
        private readonly usersRepository: UsersRepository,
        private readonly validatorService: GenericValidatorService,
    ) {
        this.logger.setContext(GameInstancesController.name);
    }

    /**
     * Retrieves all game instances.
     * @returns An array of GameInstanceInfo objects containing information about all existing game instances.
     */
    @Get()
    getAll(): GameInstanceInfo[] {
        const instances = this.instancesService.all();
        return instances.map((i) => i.info);
    }

    /**
     * Creates a new game instance.
     * @returns The newly created GameInstance's info.
     */
    @Post()
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    create(@Body() payload: GameInstanceCreationPayload, @Request() req: AuthenticatedRequest): GameInstanceInfo {
        const canUserCreateInstances = this.validatorService.validate(Validations.CanUserOperateInstace, { user: req.authenticated });
        if (!canUserCreateInstances) {
            throw new HttpException(`User not allowed to create instances.`, HttpStatus.FORBIDDEN);
        }

        let identifier = GAME_SERVER_BUILDS.find(buildData => buildData.identifier === payload.identifier)?.identifier;
        if (!identifier) {
            throw new HttpException(`Game instance with identifier ${identifier} not found.`, HttpStatus.NOT_FOUND);
        }

        try {
            const instance = this.instancesService.create(identifier, payload.custom_id);
            return instance.info;
        }
        catch (error) {
            this.logger.error('Error creating game instance:', error);
            if (error instanceof GameInstanceCreationFailedException) {
                throw new HttpException(error.message, error.status);
            }
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a specific game instance by its ID.
     * 
     * @param id - The ID of the game instance to retrieve.
     * @returns The `GameInstanceInfo` object containing information about the specified game instance.
     * @throws {HttpException} If no instance with the given ID exists or if there's an error during retrieval.
     */
    @Get(':id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getInstance(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<GameInstanceInfo>> {
        try {
            const instance = this.instancesService.get(id);
            if (!instance) {
                throw new HttpException(`No instance with id ${id}.`, HttpStatus.NOT_FOUND);
            }

            const user = await this.usersRepository.findOne({ where: { id: req.authenticated.id } });
            if (!user) {
                throw new UserNotFoundException();
            }

            const userCanSeeInstance = this.validatorService.validate(Validations.CanUserSeeInstace, { user, instance });
            if (!userCanSeeInstance) {
                throw new HttpException(`User not allowed to see instance.`, HttpStatus.FORBIDDEN);
            }

            return responser.data(instance.info);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Error getting instance.`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Get(':id/exists')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async instanceExists(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<boolean>> {

        try {
            const instance = this.instancesService.get(id);

            const user = await this.usersRepository.findOne({ where: { id: req.authenticated.id } });
            if (!user) {
                throw new UserNotFoundException();
            }

            const userCanSeeInstance = this.validatorService.validate(
                Validations.CanUserSeeInstace,
                { user, instance }
            );

            if (!userCanSeeInstance || instance == null || instance.status === InstanceStatus.Destroying) {
                return responser.data(false);
            }

            return responser.data(true);
        }
        catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Error validating instance existence: ${error.message}.`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Destroys a game instance.
     * @param id The ID of the instance to destroy.
     * @returns true if the instance was successfully destroyed, false otherwise.
     */
    @Delete(':id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async destroyInstance(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<boolean>> {
        const instance = this.instancesService.get(id);
        if (!instance) {
            throw new HttpException(`No instance with id ${id}.`, HttpStatus.NOT_FOUND);
        }

        const user = await this.usersRepository.findOne({ where: { id: req.authenticated.id } });
        if (!user) {
            throw new UserNotFoundException();
        }

        const userCanOperateInstance = this.validatorService.validate(Validations.CanUserOperateInstace, { user, instance });
        if (!userCanOperateInstance) {
            throw new HttpException(`User not allowed to operate instance.`, HttpStatus.FORBIDDEN);
        }

        instance.destroy();

        return responser.success();
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post(':id/join')
    async handleJoinInstanceRequest(@Param('id') instanceId: string, @Request() req: any): Promise<ApiResponse<JoinInstanceData>> {
        const instance = this.instancesService.get(instanceId);
        if (!instance) {
            throw new HttpException(`No instance with id ${instanceId}.`, HttpStatus.NOT_FOUND);
        }

        const user = await this.usersRepository.findOne({ where: { id: req.authenticated.id } });
        if (!user) {
            throw new UserNotFoundException();
        }

        const userCanJoinInstance = this.validatorService.validate(Validations.CanUserJoinInstace, { user, instance });
        if (!userCanJoinInstance) {
            throw new HttpException(`User not allowed to join instance.`, HttpStatus.FORBIDDEN);
        }

        try {
            const { bridgeToken } = await instance.players.startPlayerJoinProcess(user);
            const connectivity = instance.connectivity;

            return responser.data({
                bridge_token: bridgeToken,
                connectivity,
            })
        }
        catch (error) {
            this.logger.error(error);
            if (error instanceof UserNotFoundException || error instanceof InvalidCredentialsException) {
                throw error; // Throw the exception to be handled by the global exception filter
            }
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(`Joining instance failed.`, HttpStatus.INTERNAL_SERVER_ERROR);
        };
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get(':id/connectivity')
    async handleGetInstanceRequest(@Param('id') instanceId: string, @Request() req: any): Promise<ApiResponse<InstanceConnectivityData>> {
        const instance = this.instancesService.get(instanceId);
        if (!instance) {
            throw new HttpException(`No instance with id ${instanceId}.`, HttpStatus.NOT_FOUND);
        }

        const user = await this.usersRepository.findOne({ where: { id: req.authenticated.id } });
        if (!user) {
            throw new UserNotFoundException();
        }

        const userCanJoinInstance = this.validatorService.validate(Validations.CanUserJoinInstace, { user, instance });
        if (!userCanJoinInstance) {
            throw new HttpException(`User not allowed to join instance.`, HttpStatus.FORBIDDEN);
        }

        return responser.data(instance.connectivity);
    }

}