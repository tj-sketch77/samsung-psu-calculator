import AppKit

let width = 1200
let height = 630
let outputPath = "og-image.png"

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

func roundedRect(_ rect: CGRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, lineWidth: CGFloat = 1) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    fill.setFill()
    path.fill()
    if let stroke {
        stroke.setStroke()
        path.lineWidth = lineWidth
        path.stroke()
    }
}

func drawBadge(_ text: String, x: CGFloat, y: CGFloat, width: CGFloat) {
    let rect = CGRect(x: x, y: y, width: width, height: 42)
    roundedRect(rect, radius: 21, fill: NSColor.white.withAlphaComponent(0.15), stroke: NSColor.white.withAlphaComponent(0.28))
    drawText(text, rect: rect.insetBy(dx: 18, dy: 9), size: 17, weight: .bold, color: .white, align: .center)
}

func drawMetric(title: String, value: String, footnote: String, rect: CGRect, accent: NSColor) {
    roundedRect(rect, radius: 24, fill: .white, stroke: color(0xd9e4f2), lineWidth: 1.2)
    drawText(title, rect: CGRect(x: rect.minX + 28, y: rect.minY + 26, width: rect.width - 56, height: 30), size: 22, weight: .bold, color: color(0x4b5f78))
    drawText(value, rect: CGRect(x: rect.minX + 28, y: rect.minY + 64, width: rect.width - 56, height: 52), size: 36, weight: .heavy, color: color(0x0b55a0))
    drawText(footnote, rect: CGRect(x: rect.minX + 28, y: rect.minY + 122, width: rect.width - 56, height: 26), size: 17, weight: .medium, color: color(0x6f7f91))
    let line = NSBezierPath()
    line.move(to: CGPoint(x: rect.minX + 28, y: rect.maxY - 24))
    line.line(to: CGPoint(x: rect.maxX - 28, y: rect.maxY - 24))
    accent.withAlphaComponent(0.78).setStroke()
    line.lineWidth = 5
    line.stroke()
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

roundedRect(CGRect(x: 54, y: 54, width: 1092, height: 522), radius: 34, fill: NSColor.white.withAlphaComponent(0.1), stroke: NSColor.white.withAlphaComponent(0.22), lineWidth: 1.2)

drawBadge("Samsung PSU Calculator", x: 84, y: 94, width: 260)
drawBadge("Daily 18:00 KST", x: 364, y: 94, width: 190)

drawText("삼성전자 PSU 계산기", rect: CGRect(x: 84, y: 164, width: 690, height: 78), size: 64, weight: .heavy, color: .white)
drawText("기준주가 · 예상 보상 · 세후 체감액", rect: CGRect(x: 88, y: 250, width: 690, height: 42), size: 30, weight: .bold, color: NSColor.white.withAlphaComponent(0.88))
drawText("삼전 PSU 기준과 수령 시나리오를 한눈에 확인하세요", rect: CGRect(x: 88, y: 304, width: 690, height: 34), size: 24, weight: .medium, color: NSColor.white.withAlphaComponent(0.76))

let panel = CGRect(x: 702, y: 94, width: 414, height: 244)
roundedRect(panel, radius: 28, fill: NSColor.white.withAlphaComponent(0.96), stroke: NSColor.white.withAlphaComponent(0.75), lineWidth: 1.2)
drawText("PSU 보상 구간", rect: CGRect(x: 734, y: 126, width: 260, height: 30), size: 24, weight: .heavy, color: color(0x0b55a0))
drawText("100% 이상", rect: CGRect(x: 734, y: 172, width: 170, height: 38), size: 33, weight: .heavy, color: color(0x101a2b))
drawText("최대 2배 지급", rect: CGRect(x: 734, y: 220, width: 220, height: 32), size: 25, weight: .bold, color: color(0xe31837))
drawText("CL1~CL4 예상 수령액 계산", rect: CGRect(x: 734, y: 278, width: 330, height: 28), size: 20, weight: .medium, color: color(0x617184))

let cardY: CGFloat = 380
drawMetric(title: "기준주가", value: "VWAP 평균", footnote: "1주 · 1개월 · 2개월", rect: CGRect(x: 84, y: cardY, width: 310, height: 150), accent: color(0x0b55a0))
drawMetric(title: "시나리오", value: "250원 단위", footnote: "현재가 기준 조정", rect: CGRect(x: 444, y: cardY, width: 310, height: 150), accent: color(0x18a058))
drawMetric(title: "세금 참고", value: "세후 체감액", footnote: "한계세율 선택", rect: CGRect(x: 804, y: cardY, width: 310, height: 150), accent: color(0xe31837))

drawText("Unofficial reference tool · tj-sketch77.github.io/samsung-psu-calculator", rect: CGRect(x: 84, y: 548, width: 680, height: 24), size: 17, weight: .medium, color: NSColor.white.withAlphaComponent(0.78))

NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Failed to render OG image")
}

try png.write(to: URL(fileURLWithPath: outputPath))
