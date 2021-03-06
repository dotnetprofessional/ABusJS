import { Saga } from '../../src/Saga';
import { IMessage, handler, IMessageHandlerContext } from 'abus';
import { AuthenticateUserRequest } from './Services/AuthenticateUserRequest';
import { AuthenticateUserResponse } from './Services/AuthenticateUserResponse';
import { AuthenticationStatus } from './Services/AuthenticationStatus';
import { TwoFactorAuthenticateUserRequest } from './Services/TwoFactorAuthenticateUserRequest';
import { TwoFactorAuthenticateUserResponse } from './Services/TwoFactorAuthenticateUserResponse';

export class LoginRequest {
    user: string;
}
 
export class UserLoginSaga extends Saga<any>{

    constructor() {
        super();

        this.sagaStartedWith("LoginRequest");
    }
    public configureSagaKey(message: IMessage<any>): string {
        switch (message.type) {
            case AuthenticateUserRequest.name:
                return (message.payload as LoginRequest).user;
            default:
                throw new Error("Unknown message type: " + message.type);
        }
    }

    @handler(LoginRequest)
    public async authenticate(message: LoginRequest, context: IMessageHandlerContext) {
        // Authenticate with the authentication service
        const response = await context.sendWithReplyAsync<AuthenticateUserResponse>(new AuthenticateUserRequest(message.user));

        if (response.result === AuthenticationStatus.requires2FA) {
            // Now verify with 2FA too
            const twoFAResult = await context.sendWithReplyAsync<TwoFactorAuthenticateUserResponse>(new TwoFactorAuthenticateUserRequest(message.user));
            context.replyAsync(twoFAResult.result);
        } else {
            context.replyAsync(response.result);
        }
    }
}