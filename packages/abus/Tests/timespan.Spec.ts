import TimeSpan from '../App/Timespan';

describe("Creating a time span of 1 day", () => {
    let timespan = new TimeSpan(1, 0, 0, 0, 0);

    it("should return 1 for days()", () => {
        timespan.days.should.be.equal(1);
    });

    it("should return 24 for totalHours()", () => {
        timespan.totalHours.should.be.equal(24);
    });

    it("should return 1,440 for totalMinutes()", () => {
        timespan.totalMinutes.should.be.equal(1440);
    });

    it("should return 86,400 for totalSeconds()", () => {
        timespan.totalSeconds.should.be.equal(86400);
    });

    it("should return 86400000 for totalMilliseconds()", () => {
        timespan.totalMilliseconds.should.be.equal(86400000);
    });
})