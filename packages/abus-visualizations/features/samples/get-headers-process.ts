const data: any = [
    {
        "type": "GetAgreementHeadersCommand",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "intent": "send",
            "messageId": "47dd71d1-5a0b-4627-944d-26a85c823a3a",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
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
            "messageId": "973a69ba-d81f-4116-be3d-9b1b7a62f5ca",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
            "correlationId": "47dd71d1-5a0b-4627-944d-26a85c823a3a"
        }
    },
    {
        "type": "GetAgreementHeadersRequest",
        "payload": {
            "tpid": "12345"
        },
        "metaData": {
            "messageId": "afb7da8a-4920-4287-9e68-5c6154523d0a",
            "intent": "sendReply",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
            "correlationId": "47dd71d1-5a0b-4627-944d-26a85c823a3a",
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
            "replyTo": "afb7da8a-4920-4287-9e68-5c6154523d0a",
            "messageId": "aaf4abcc-ad5a-419d-a859-7ca48352e4b4",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
            "correlationId": "afb7da8a-4920-4287-9e68-5c6154523d0a"
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
            "messageId": "185c9f41-0f82-4361-9193-f29ad5b64e6a",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
            "correlationId": "47dd71d1-5a0b-4627-944d-26a85c823a3a"
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
            "messageId": "00c1639f-5489-4dba-a605-b544bf67093a",
            "conversationId": "3e3ad49b-69a9-4b0c-98b2-5eb073a5e069",
            "correlationId": "47dd71d1-5a0b-4627-944d-26a85c823a3a"
        }
    }
];

export default data;