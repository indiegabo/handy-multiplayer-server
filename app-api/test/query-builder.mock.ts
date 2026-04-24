export type MockQueryBuilder = {
    where: jest.Mock;
    andWhere: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    getMany: jest.Mock;
    getOne: jest.Mock;
};