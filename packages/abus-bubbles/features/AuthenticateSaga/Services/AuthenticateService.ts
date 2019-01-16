import { AuthenticateUserRequest } from "./AuthenticateUserRequest";
import { IMessageHandlerContext, handler } from "../../../../src";
import { AuthenticateUserResponse } from "./AuthenticateUserResponse";
import { AuthenticationStatus } from "./AuthenticationStatus";


export class AuthenticateService {
    @handler(AuthenticateUserRequest)
    public authenticate(message: AuthenticateUserRequest, context: IMessageHandlerContext) {
        const response = new AuthenticateUserResponse();

        switch (message.user) {
            case "John Smith":
                response.result = AuthenticationStatus.authenticated;
                break;
            case "Jane Doe":
                response.result = AuthenticationStatus.requires2FA;
                break;
            case "John Doe":
                response.result = AuthenticationStatus.requires2FA;
                break;
            default:
                response.result = AuthenticationStatus.unauthenticated
        }
    }
}