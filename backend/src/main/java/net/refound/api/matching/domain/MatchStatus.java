package net.refound.api.matching.domain;

/** State of a suggested pairing between a lost report and a found report. */
public enum MatchStatus {
    /** Scored above the threshold and surfaced to the lost item's reporter. */
    SUGGESTED,
    /** The reporter said this is not their item. */
    DISMISSED,
    /** A claim was filed off the back of this suggestion. */
    CLAIMED
}
