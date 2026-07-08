export default function CountryFlag({code, width = 24, height = 18}: {code: string, width?: number, height?: number}) {
    const flagUrl = `https://flagcdn.com/24x18/${code.toLowerCase()}.png`
    return (
        <img
            src={flagUrl}
            alt=""
            width={width}
            height={height}
            className="rounded-sm shrink-0"
            loading="lazy"
        />
    )
}