class Time
{
    /**
     *  return "DD:HH:MM:SS" from a time diff (dateTo-dateFrom)
     */
    static formatTimeDiff(timeNowMs, timeInPastMs, isShort) {
        let secondsNow  = Math.round( timeNowMs / 1000 );
        let secondsPast = Math.round( timeInPastMs / 1000 );
        let s = Math.max(0, secondsNow - secondsPast);
        let day = Math.floor(s/86400); s = s % 86400;
        let h = Math.floor(s/3600); s = s % 3600;
        let m = Math.floor(s/60); s = s % 60;
        return (
            ((!isShort || day > 0) ? ((day < 10 ? "0" : "") + day + ":") : "") +
            ((!isShort || h   > 0) ? ((h   < 10 ? "0" : "") + h   + ":") : "") +
            (m   < 10 ? "0" : "") + m   + ":" +
            (s   < 10 ? "0" : "") + s
        );
    }
}