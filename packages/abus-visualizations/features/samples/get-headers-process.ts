export const data: any = [
    {
        "type": "GetAgreementHeadersCommand",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "intent": "send",
            "messageId": "3acf13df-1f2c-4786-bcad-8bb3d84baa79",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "startProcessing": 1547859314091,
            "endProcessing": 1547859314092,
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
            "messageId": "37929b26-bc2f-46ce-bb89-6d022e751a6a",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "correlationId": "3acf13df-1f2c-4786-bcad-8bb3d84baa79"
        }
    },
    {
        "type": "GetAgreementHeadersRequest",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "messageId": "8b22904e-04e7-4a6e-95bc-67677481ebe9",
            "intent": "sendReply",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "correlationId": "3acf13df-1f2c-4786-bcad-8bb3d84baa79",
            "startProcessing": 1547859314097,
            "endProcessing": 1547859314097,
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
            "replyTo": "8b22904e-04e7-4a6e-95bc-67677481ebe9",
            "messageId": "f0916955-4de0-4b9b-8488-6ea48ea80ff4",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "correlationId": "8b22904e-04e7-4a6e-95bc-67677481ebe9",
            "startProcessing": 1547859314101,
            "endProcessing": 1547859314101
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
            "messageId": "0bb0ca85-aad8-4f40-8d4c-ad442f25f641",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "correlationId": "3acf13df-1f2c-4786-bcad-8bb3d84baa79"
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
            "messageId": "d5e4073e-276b-4d9c-a8e7-0e6a8c200313",
            "conversationId": "0dfa1d21-f77f-4540-9f56-f006d911470d",
            "correlationId": "3acf13df-1f2c-4786-bcad-8bb3d84baa79"
        }
    }
];
