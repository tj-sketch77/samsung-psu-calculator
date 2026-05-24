import AppKit

let width = 1200
let height = 630
let outputPath = "og-image-simple-20260524.png"

func color(_ hex: UInt32) -> NSColor {
    let r = CGFloat((hex >> 16) & 0xff) / 255
    let g = CGFloat((hex >> 8) & 0xff) / 255
    let b = CGFloat(hex & 0xff) / 255
    return NSColor(calibratedRed: r, green: g, blue: b, alpha: 1)
}

func drawText(_ text: String, rect: CGRect, size: CGFloat, weight: NSFont.Weight, color textColor: NSColor, align: NSTextAlignment = .left) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = align
    paragraph.lineBreakMode = .byWordWrapping
    let font = NSFont.systemFont(ofSize: size, weight: weight)
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: textColor,
        .paragraphStyle: paragraph
    ]
    NSString(string: text).draw(in: rect, withAttributes: attrs)
}

guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: width,
    pixelsHigh: height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fatalError("Failed to create bitmap")
}

bitmap.size = NSSize(width: width, height: height)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

let bounds = CGRect(x: 0, y: 0, width: width, height: height)
let bg = NSGradient(colors: [color(0x0a4fa3), color(0x0f67c8), color(0xf4f8fc)])!
bg.draw(in: bounds, angle: -18)

drawText(
    "삼전 PSU 기준과 수령 시나리오를 한눈에 확인하세요.",
    rect: CGRect(x: 90, y: 360, width: 980, height: 44),
    size: 29,
    weight: .semibold,
    color: NSColor.white.withAlphaComponent(0.82)
)
drawText(
    "기준 주가, 예상 보상, 세후 체감액",
    rect: CGRect(x: 90, y: 288, width: 990, height: 52),
    size: 40,
    weight: .bold,
    color: NSColor.white.withAlphaComponent(0.94)
)
drawText(
    "삼성전자 PSU 계산기",
    rect: CGRect(x: 84, y: 160, width: 1030, height: 92),
    size: 78,
    weight: .heavy,
    color: .white
)

NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Failed to render OG image")
}

try png.write(to: URL(fileURLWithPath: outputPath))
