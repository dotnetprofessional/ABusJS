# Design Notes

Transports only support filtering on a queue when defining the transport instance.
If multiple messages types/filters are needed for a single queue then multiple instances
of the transport need to be configured with their associated message types.