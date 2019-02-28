export const data: any = [
    {
        "type": "GetAgreementHeadersCommand",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "sentBy": "Bubbles",
            "intent": "send",
            "messageId": "512c2f4d-e616-4000-9117-5bff0cebe189",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "startProcessing": 1551318674560,
            "endProcessing": 1551318674561,
            "receivedBy": "AgreementsProcess"
        }
    },
    {
        "type": "AgreementProcessStatusEvent",
        "payload": {
            "operation": "GetAgreementHeadersCommand",
            "status": "EXECUTING"
        },
        "metaData": {
            "intent": "publish",
            "messageId": "3cc8ec75-230e-4881-a5c0-905329a59f9e",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "correlationId": "512c2f4d-e616-4000-9117-5bff0cebe189",
            "sentBy": "AgreementsProcess",
            "receivedBy": "Bubbles"
        }
    },
    {
        "type": "GetAgreementHeadersRequest",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "messageId": "b8bde0f1-1ba0-4f40-99be-323366caa3f8",
            "intent": "sendReply",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "correlationId": "512c2f4d-e616-4000-9117-5bff0cebe189",
            "sentBy": "AgreementsProcess",
            "startProcessing": 1551318674565,
            "endProcessing": 1551318674565,
            "receivedBy": "AgreementService"
        }
    },
    {
        "type": "GetAgreementHeadersRequest.reply",
        "payload": {
            "tpid": "12345",
            "agreementHeaders": [
                {
                    "id": "1",
                    "name": "Agreement 1",
                    "tpid": "12345"
                },
                {
                    "id": "2",
                    "name": "Agreement 2",
                    "tpid": "12345"
                }
            ],
            "lastPageKey": "3"
        },
        "metaData": {
            "intent": "reply",
            "replyTo": "b8bde0f1-1ba0-4f40-99be-323366caa3f8",
            "messageId": "15deeb2d-fe92-42d8-9c85-72cd7514f476",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "correlationId": "b8bde0f1-1ba0-4f40-99be-323366caa3f8",
            "sentBy": "AgreementService",
            "startProcessing": 1551318674568,
            "endProcessing": 1551318674568,
            "receivedBy": "AgreementsProcess"
        }
    },
    {
        "type": "ParentCompanyHeadersEvent",
        "payload": {
            "tpid": "12345",
            "lastPageKey": "3",
            "agreementHeaders": [
                {
                    "id": "1",
                    "name": "Agreement 1",
                    "tpid": "12345"
                },
                {
                    "id": "2",
                    "name": "Agreement 2",
                    "tpid": "12345"
                }
            ]
        },
        "metaData": {
            "intent": "publish",
            "messageId": "5897f2fa-94a8-4cf4-842b-dbd347be479d",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "correlationId": "512c2f4d-e616-4000-9117-5bff0cebe189",
            "sentBy": "AgreementsProcess",
            "receivedBy": "Bubbles"
        }
    },
    {
        "type": "AgreementProcessStatusEvent",
        "payload": {
            "operation": "GetAgreementHeadersCommand",
            "status": "COMPLETE"
        },
        "metaData": {
            "intent": "publish",
            "messageId": "470e148b-5b70-4045-bd2d-be99e65e6d22",
            "conversationId": "cc4049fd-4f7f-4566-9904-1401af0ab3f3",
            "correlationId": "512c2f4d-e616-4000-9117-5bff0cebe189",
            "sentBy": "AgreementsProcess",
            "receivedBy": "Bubbles"
        }
    }
];