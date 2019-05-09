# Release Notes
## 0.1.0-alpha.3

### additional with no issue logged
* fixed bug with validating null values
* added support to execute until an observed message is found `bubbles.executeUntilAsync`
* added partial object validation. This can be used to validate a partial message against the actual message observed. `bubbles.partialMatch`