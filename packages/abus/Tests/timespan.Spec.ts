import TimeSpan from '../App/Timespan';

describe("Creating a time span of 1 day", () => {
    let timespan = new TimeSpan(1, 0, 0, 0, 0);

    it("should return 1 for days()", () => {
        expect(timespan.days).toBe(1);
    });

    it("should return 24 for totalHours()", () => {
        expect(timespan.totalHours).toBe(24);
    });

    it("should return 1,440 for totalMinutes()", () => {
        expect(timespan.totalMinutes).toBe(1440);
    });

    it("should return 86,400 for totalSeconds()", () => {
        expect(timespan.totalSeconds).toBe(86400);
    });

    it("should return 86400000 for totalMilliseconds()", () => {
        expect(timespan.totalMilliseconds).toBe(86400000);
    });
})