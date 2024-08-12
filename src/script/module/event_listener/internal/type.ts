export type CustomAddEventListenerOptions = Omit<AddEventListenerOptions, 'once'>;
type EventListenerAndOptions = [EventListener, boolean | CustomAddEventListenerOptions | undefined];
type ListenerMap = Map<EventListener, [EventListenerAndOptions | null, EventListenerAndOptions | null]>;
export type EventMap = Map<string, ListenerMap>;
export type ElementMap = Map<EventTarget, EventMap>;
