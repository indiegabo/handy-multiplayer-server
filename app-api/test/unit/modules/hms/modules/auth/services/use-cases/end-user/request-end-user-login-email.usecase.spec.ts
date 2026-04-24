import { RequestEndUserLoginEmailUseCase } from '../../../../../../../../../src/modules/hms/modules/auth/services/use-cases/end-user/request-end-user-login-email.usecase';

describe('RequestEndUserLoginEmailUseCase', () => {
    let sut: RequestEndUserLoginEmailUseCase;
    const mockUsers: any = {
        findEndUserByEmail: jest.fn(),
        findByUsername: jest.fn(),
        createUser: jest.fn(),
    };
    const mockOtt: any = { create: jest.fn() };
    const mockMail: any = { sendLoginToken: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        sut = new RequestEndUserLoginEmailUseCase(
            mockUsers,
            mockOtt,
            mockMail,
        );
    });

    it('creates user when email does not exist and returns masked email', async () => {
        mockUsers.findEndUserByEmail.mockResolvedValue(null);
        mockUsers.createUser.mockResolvedValue({ id: 'u-1', email: 'a@b.com' });
        mockOtt.create.mockResolvedValue({ token: '123456' });

        const result = await sut.execute('A@B.COM');

        expect(mockUsers.findEndUserByEmail).toHaveBeenCalledWith('a@b.com');
        expect(mockUsers.createUser).toHaveBeenCalledWith({ email: 'a@b.com' });
        expect(mockOtt.create).toHaveBeenCalled();
        expect(mockMail.sendLoginToken).toHaveBeenCalledWith('a@b.com', '123456');

        expect(result).toEqual({
            recognized_username: null,
            redacted_email: 'a****@b.com',
        });
    });

    it('uses existing user by email and returns recognized username', async () => {
        mockUsers.findEndUserByEmail.mockResolvedValue({ id: 'u-2', email: 'x@y.com' });
        mockOtt.create.mockResolvedValue({ token: '000111' });

        const result = await sut.execute('x@y.com');

        expect(mockUsers.createUser).not.toHaveBeenCalled();
        expect(mockOtt.create).toHaveBeenCalledWith({ userId: 'u-2', userType: 'end_user' }, expect.any(Number));
        expect(mockMail.sendLoginToken).toHaveBeenCalledWith('x@y.com', '000111');

        expect(result).toEqual({
            recognized_username: null,
            redacted_email: 'x****@y.com',
        });
    });

    it('resolves username and sends token to linked email', async () => {
        mockUsers.findByUsername.mockResolvedValue({
            id: 'u-3',
            username: 'indiegabodev',
            email: 'indiegabodev@gmail.com',
        });
        mockOtt.create.mockResolvedValue({ token: '789123' });

        const result = await sut.execute('indiegabodev');

        expect(mockUsers.findByUsername).toHaveBeenCalledWith('indiegabodev');
        expect(mockUsers.createUser).not.toHaveBeenCalled();
        expect(mockMail.sendLoginToken).toHaveBeenCalledWith(
            'indiegabodev@gmail.com',
            '789123',
        );

        expect(result).toEqual({
            recognized_username: 'indiegabodev',
            redacted_email: 'ind****@gmail.com',
        });
    });

    it('returns null payload and does not dispatch when username is missing', async () => {
        mockUsers.findByUsername.mockResolvedValue(null);

        const result = await sut.execute('unknown_user');

        expect(mockUsers.findByUsername).toHaveBeenCalledWith('unknown_user');
        expect(mockOtt.create).not.toHaveBeenCalled();
        expect(mockMail.sendLoginToken).not.toHaveBeenCalled();
        expect(result).toEqual({
            recognized_username: null,
            redacted_email: null,
        });
    });
});
