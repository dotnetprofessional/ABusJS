import * as chai from "chai";
import Hashtable from '../App/Hashtable';

const should = chai.should();

describe("Creating instance", () => {
    var ht = new Hashtable<string>();
    ht.add("test.key", "test.value");

    it("should support generic types", () => {
        let ht = new Hashtable<number>();
        ht.add("key", 2334)
        ht.count.should.be.equal(1);
    });
})


describe("Adding an item to a hashtable", () => {
    var ht = new Hashtable<string>();
    ht.add("test.key", "test.value");

    it("should increase the count by 1", () => {
        ht.count.should.be.equal(1);
    });

    it("should allow the retrieval of the value by key", () => {
        ht.item("test.key").should.be.equal("test.value");
    });

    it("should contain the key", () => {
        ht.contains("test.key").should.be.equal(true);
    });

    it("should throw duplicate exception if key already exists", () => {
        // need to wrap errors in its own function
        var key = "test.key";
        var duplicateKey = () => {
            ht.add(key, "");
        }
        should.throw(duplicateKey, `The key ${key} already exists.`);
    });

    it("should include the new item in keys collection", () => {
        ht.keys()[0].should.be.equal("test.key");
    });

    it("should be returned in for .. in", () => {
        let foundItems = [];
        for (let item of ht.items()) {
            foundItems.push(item);
        }
        foundItems.length.should.be.equal(1);
        foundItems[0].should.be.equal("test.value");
    });

});

describe("Removing an item from a hashtable", () => {
    var ht = new Hashtable<string>();

    // Arrange
    ht.add("test.key1", "test.value");
    ht.add("test.key2", "test.value");
    ht.add("test.key", "test.value");

    // Act
    ht.remove("test.key");

    // Assert
    it("should decrease the count by 1", () => {
        ht.count.should.be.equal(2);
    });

    it("should disallow the retrieval of the value by key", () => {
        should.not.exist(ht.item("test.key"));
    });

    it("should not contain the key", () => {
        ht.contains("test.key").should.be.equal(false);
    });

    it("should not contain item in keys collection", () => {
        ht.keys().length.should.be.equal(2);
    });
})

describe("Clearing the hashtable", () => {
    var ht = new Hashtable<string>();

    // Arrange
    ht.add("test.key1", "test.value");
    ht.add("test.key2", "test.value");
    ht.add("test.key", "test.value");

    // Act
    ht.clear();

    // Assert
    it("should have a count of 0", () => {
        ht.count.should.be.equal(0);
    });

    it("should have no values for the keys collection", () => {
        ht.keys().length.should.be.equal(0);
    });
})

describe("Updating an item to a hashtable", () => {
    var ht = new Hashtable<string>();

    it("should add the item if not found", () => {
        ht.clear();
        ht.update("test.key", "test.value");
        ht.item("test.key").should.be.equal("test.value");
    });

    it("should update the item if already exist", () => {
        ht.clear();
        ht.add("test.key", "test.value2");
        ht.update("test.key", "test.value");
        ht.item("test.key").should.be.equal("test.value");
    });
});
