"use client"

import dynamic from "next/dynamic"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

type Props = {
  animationData: object
  loop?: boolean
  autoplay?: boolean
  style?: React.CSSProperties
  className?: string
  onComplete?: () => void
}

export function LottiePlayer({ animationData, loop = false, autoplay = true, style, className, onComplete }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={style}
      className={className}
      onComplete={onComplete}
    />
  )
}
