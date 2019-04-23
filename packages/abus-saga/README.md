### Sagas
Adds support for Sagas and Processes to the ABus messaging library. 

```ts
npm install abus-saga --save
```


NOTES:

data1: 
data2:

constructor
  [this.data1, this.storeData1] = this.useStorage(new InMemoryKeyValueStore(),<key>) 
  [this.data2, this.storeData2] = this.useKeyedStorage(new InMemoryKeyValueStore(),<key>) 

  this.data1 = this.useStorage(new InMemoryKeyValueStore(),<key>) 
  this.data2 = this.useKeyedStorage(new InMemoryKeyValueStore(),<key>) 


handler() {
   this.data1()
   this.storeData1(this.data1)

   this.data1.getValueAsync()
   this.data1.storeAsync()
}

useStorage:
  Key is optional and if not supplied will use the class name as the key ie global to the process
  For truly global storage however, a key name can be passed either as a string or function

useKeyedStorage:
  Is a specialized version of useStorage which uses the property getStorageKey function for the key


Processes:
  useStorage - as processes are typically not   


  thoughts:
   - sagas have a single default data that will use useKeyedStorage, this will allow the other aspects of a saga to work ie check that new messages that come after the start of a saga work as expected ie can check if the saga has started etc.
   - sagas can optionally make use of useStorage and useStorageKey to store additional data for the saga. The issue here becomes cleaning up after a saga completes. Might have to let dev handle clean up, or maybe auto-handle any useKeyedStorage by registering them with the saga as secondary storage.

   - processes are not specific to a particular message. So they can use useStorage. This would be the only method on this class. Ie it shouldn't have access to the useKeyedStorage method.

   maybe process is the base class that Saga extends?
