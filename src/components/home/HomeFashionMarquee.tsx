import { FASHION_MARQUEE_SEQUENCE } from "@/components/brand/fashion-asset-catalog";
import { FashionProductIcon } from "@/components/brand/fashion-product-icons";

function FashionWordMarqueeRow() {
  return (
    <div className="home-fashion-marquee-row">
      {FASHION_MARQUEE_SEQUENCE.map((item, i) => (
        <span key={`${item.asset}-${item.label}-${i}`} className="home-fashion-marquee-unit">
          <FashionProductIcon asset={item.asset} className="home-fashion-marquee-sketch" />
          <span className="home-fashion-marquee-label">{item.label}</span>
          <span className="home-fashion-marquee-dot" aria-hidden />
        </span>
      ))}
    </div>
  );
}

function FashionMarqueeTile() {
  return (
    <div className="home-fashion-marquee-tile">
      <div className="home-fashion-marquee-tile-bg" aria-hidden />
      <FashionWordMarqueeRow />
    </div>
  );
}

/** Separate fashion word + illustration strip — does not replace geometric HomeMarquee. */
export function HomeFashionMarquee() {
  return (
    <div className="home-fashion-marquee" aria-hidden="true">
      <div className="home-fashion-marquee-track">
        <FashionMarqueeTile />
        <FashionMarqueeTile />
      </div>
    </div>
  );
}
