import { IMessageHandlerContext, handler } from "../../../../src";
import { AuthenticationStatus } from "./AuthenticationStatus";
import { TwoFactorAuthenticateUserRequest } from "./TwoFactorAuthenticateUserRequest";
import { TwoFactorAuthenticateUserResponse } from "./TwoFactorAuthenticateUserResponse";


export class TwoFactorAuthenticationService {
    @handler(TwoFactorAuthenticateUserRequest)
    public authenticate(message: TwoFactorAuthenticateUserRequest, context: IMessageHandlerContext) {
        const response = new TwoFactorAuthenticateUserResponse();

        switch (message.user) {
            case "Jane Doe":
                response.result = AuthenticationStatus.requires2FA;
                break;
            default:
                response.result = AuthenticationStatus.unauthenticated
        }
    }
}