const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function parseBatchDate(dateStr)
{
    if(!dateStr)
    {
        return null
    }
    let parts=dateStr.split("-").map(Number)
    if(parts.length!==3 || parts.some(Number.isNaN))
    {
        return null
    }
    let [day,month,year]=parts
    if(day<1 || day>31 || month<1 || month>12 || year<1000 || year>9999)
    {
        return null
    }
    let date=new Date(year,month-1,day)
    // reject rollover dates (e.g. "31-04-2026" silently becoming 1 May)
    if(date.getFullYear()!==year || date.getMonth()!==month-1 || date.getDate()!==day)
    {
        return null
    }
    return date
}

export function isBatchUpcoming(dateStr)
{
    let date=parseBatchDate(dateStr)
    if(!date)
    {
        return false
    }
    let today=new Date()
    today.setHours(0,0,0,0)
    return date.getTime()>=today.getTime()
}

export function formatBatchDateShort(dateStr)
{
    let date=parseBatchDate(dateStr)
    if(!date)
    {
        return ""
    }
    return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`
}

export function getNextBatchForCourse(courseName,batches)
{
    let upcoming=batches
        .filter((batch)=>batch.name===courseName && isBatchUpcoming(batch.date))
        .sort((a,b)=>parseBatchDate(a.date)-parseBatchDate(b.date))
    return upcoming[0] || null
}

export function getNextBatch(batches)
{
    // The soonest upcoming batch across every course — what the hero shows, so
    // a visitor sees a date without having to scroll to the Batches section.
    let upcoming=(batches||[])
        .filter((batch)=>isBatchUpcoming(batch.date))
        .sort((a,b)=>parseBatchDate(a.date)-parseBatchDate(b.date))
    return upcoming[0] || null
}
