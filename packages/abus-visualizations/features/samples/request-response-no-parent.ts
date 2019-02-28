export const data: any = [
    {
        "type": "AgreementRequest",
        "payload": {
            "key": "DIRECT:1234567890"
        },
        "metaData": {
            "sentBy": "Bubbles",
            "messageId": "17e009f8-f838-46b3-bc6e-0a9f8429403e",
            "intent": "sendReply",
            "conversationId": "95250664-376e-460b-bf3b-63d087932e46",
            "startProcessing": 1551314974360,
            "endProcessing": 1551314974360,
            "receivedBy": "AgreementService"
        }
    },
    {
        "type": "HttpRequest",
        "payload": {
            "method": "GET",
        },
        "metaData": {
            "messageId": "409f94cb-923d-4e59-8588-311158630377",
            "intent": "sendReply",
            "conversationId": "95250664-376e-460b-bf3b-63d087932e46",
            "correlationId": "17e009f8-f838-46b3-bc6e-0a9f8429403e",
            "sentBy": "AgreementService",
            "startProcessing": 1551314974365,
            "endProcessing": 1551314974365,
            "receivedBy": "HttpService"
        }
    },
    {
        "type": "HttpRequest.reply",
        "payload": {
            "status": 200,
            "result": {
            }
        },
        "metaData": {
            "intent": "reply",
            "replyTo": "409f94cb-923d-4e59-8588-311158630377",
            "messageId": "1346c659-abd2-40db-9e51-3cbe628ce1a0",
            "conversationId": "95250664-376e-460b-bf3b-63d087932e46",
            "correlationId": "409f94cb-923d-4e59-8588-311158630377",
            "sentBy": "HttpService",
            "startProcessing": 1551314974389,
            "endProcessing": 1551314974389
        }
    },
    {
        "type": "AgreementRequest.reply",
        "payload": {
            "status": 200,
            "result": {
            }
        },
        "metaData": {
            "intent": "reply",
            "replyTo": "17e009f8-f838-46b3-bc6e-0a9f8429403e",
            "messageId": "1df761b0-07dc-4b4a-90ec-77a1b2c650bb",
            "conversationId": "95250664-376e-460b-bf3b-63d087932e46",
            "correlationId": "17e009f8-f838-46b3-bc6e-0a9f8429403e",
            "sentBy": "AgreementService",
            "startProcessing": 1551314974392,
            "endProcessing": 1551314974392
        }
    }
]