import { createStandardAction } from 'typesafe-actions';
import { IMonitoredEvent } from './IMonitoredEvent';
import { IWindowSizeChanged } from './IWindowSizeChanged';

export const messageSent = createStandardAction('Monitor.MessageSent')<IMonitoredEvent>();
export const messageProcessed = createStandardAction('Monitor.MessageProcessed')<IMonitoredEvent>();
// export const messageProcessed = createStandardAction('abus-devtools-message')<IMessageProcessed>();

export const windowSizeChanged = createStandardAction('Monitor.WindowSizeChanged')<IWindowSizeChanged>();
