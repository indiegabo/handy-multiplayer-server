// test-utils/mock-game-repository.ts
import { Game } from '@src/modules/sg/core/entities/game.entity';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { MockQueryBuilder } from 'test/query-builder.mock';
import { GAMES_MOCK } from '../entities/games.mock';

// Define a type for the complete mocked GameRepository, including the QueryBuilder mock
type MockGameRepository = Partial<Record<keyof GameRepository, jest.Mock>> & {
    // Add a property to hold the mock QueryBuilder instance if you want to access its methods directly
    mockQueryBuilderInstance?: MockQueryBuilder;
};


export const createMockGameRepository = (
    initialGames: Game[] = GAMES_MOCK,
): MockGameRepository => {
    let currentGames = [...initialGames];

    // Declare the mockQueryBuilder variable outside, so it can be captured
    const mockQueryBuilder: MockQueryBuilder = {
        where: jest.fn().mockReturnThis(), // Return 'this' for chaining
        andWhere: jest.fn().mockReturnThis(), // Return 'this' for chaining
        leftJoinAndSelect: jest.fn().mockReturnThis(), // Return 'this' for chaining
        getMany: jest.fn().mockImplementation(() => Promise.resolve(currentGames)),
        getOne: jest.fn().mockImplementation(() => Promise.resolve(currentGames[0])),
    };

    const gameRepositoryMock: MockGameRepository = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
            // Reset the state of filteredGames for each new queryBuilder call
            let filteredGames = [...currentGames];
            // Re-implement the filtering logic directly within the queryBuilder's methods
            // This is crucial for each queryBuilder instance to work correctly.
            mockQueryBuilder.where.mockImplementation((condition, params) => {
                if (condition.includes('LIKE')) {
                    const searchTerm = params.text.replace(/%/g, '');
                    filteredGames = filteredGames.filter(
                        (game) =>
                            game.name.includes(searchTerm) ||
                            game.description.includes(searchTerm),
                    );
                }
                return mockQueryBuilder; // Return the mockQueryBuilder for chaining
            });
            mockQueryBuilder.andWhere.mockImplementation((condition, params) => {
                if (condition.includes('type =')) {
                    filteredGames = filteredGames.filter((game) => game.type === params.type);
                } else if (condition.includes('availability =')) {
                    filteredGames = filteredGames.filter(
                        (game) => game.availability === params.availability,
                    );
                }
                return mockQueryBuilder; // Return the mockQueryBuilder for chaining
            });
            mockQueryBuilder.getMany.mockImplementation(() => Promise.resolve(filteredGames));

            return mockQueryBuilder; // Return the *same* mockQueryBuilder instance
        }),
        findById: jest.fn().mockImplementation((id) =>
            Promise.resolve(currentGames.find((game) => game.id === id))
        ),
        findOne: jest.fn().mockImplementation((options: any) => {
            if (options && options.where && options.where.id) {
                return Promise.resolve(currentGames.find((game) => game.id === options.where.id));
            }
            return Promise.resolve(null);
        }),
        save: jest.fn().mockImplementation((game: Game) => {
            const existingIndex = currentGames.findIndex((g) => g.id === game.id);
            if (existingIndex !== -1) {
                currentGames[existingIndex] = game;
            } else {
                currentGames.push(game);
            }
            return Promise.resolve(game);
        }),
        // Expose the mockQueryBuilderInstance so you can access its methods for assertions
        mockQueryBuilderInstance: mockQueryBuilder,
    };

    return gameRepositoryMock;
};