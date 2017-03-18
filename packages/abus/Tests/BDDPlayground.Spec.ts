
// function bind(content, model) {
//     var regex = new RegExp("{[\\w\\d]+}", "g");
//     return content.replace(regex, (item, pos, originalText) => {
//         // remove braces
//         if (!model) {
//             return;
//         }

//         let key = item.substring(1, item.length - 1);
//         let value = model[key];
//         return value;
//     });
// }

// /*





// let When = function () {
//     beforeEach(function () {
//         return null;
//     });
//     return afterEach(function () {
//         return null;
//     });
// };

// */
// let background = function (n) {
//     return "background:\n" + n;
// }

// let feature = function (n, d, f) {
//     debugger;
//     if (d) {
//         n += "\n" + d;
//     }
//     describe("feature: " + n, f);
// };
// let scenario = function (n, f) {
//     describe("scenario: " + n, f);
// };

// let given = function (n, f) {
//     describe("given: " + n, f);
// };
// let when = function (n, f) {
//     describe("when: " + n, f);
// };
// let then = function (n, f) {
//     it("then: " + n, f);
// };
// let and = function (n, f) {
//     it("and: " + n, f);
// };
// let but = function (n, f) {
//     it("but: " + n, f);
// };

// feature("Restricted country Migration",
//     background("This is a small summary of what this feature is about."), () => {
//         let m = { country: "SZ", currentStatus: "allowed", newStatus: "denied" };

//         before(() => {
//         });

//         scenario("Country changes its restrictive status", () => {
//             given(`${m.country} has a status of ${m.currentStatus}`, () => {
//                 when(`the status of ${m.country} changes to ${m.newStatus}`, () => {
//                     then(`the ${m.country} should reflect the new ${m.newStatus}`, () => {
//                         //expect(model).toBeLessThan(model.pears);
//                     });
//                     and("there should be more pears than apples", () => {
//                         //expect(model.pears).toBeGreaterThan(model.apples);
//                     });
//                     but("there should not be bananas", () => {
//                         //expect(model.pears).toBeGreaterThan(model.apples);
//                     });
//                 })
//             });
//         });
//     });



