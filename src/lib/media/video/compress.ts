import * as FileSystem from 'expo-file-system'
import {
  FFmpegKit,
  FFmpegSessionCompleteCallback,
  ReturnCode,
} from 'ffmpeg-kit-react-native'

const PRESET = 'faster'

export type CompressedVideo = {
  uri: string
  size: number
}

export async function compressVideo(
  file: string,
  callbacks?: {
    onProgress: (progress: number) => void
  },
) {
  const {onProgress} = callbacks || {}
  const ext = file.split('.').pop()
  const newFile = file.replace(`.${ext}`, '.compressed.mp4')

  const result = await new Promise((resolve: FFmpegSessionCompleteCallback) =>
    FFmpegKit.executeAsync(
      `-i ${file} -c:v libx264 -crf 25 -preset ${PRESET} -b:v 4M -vf "scale='if(gt(a,1),min(1920,iw),-1)':'if(gt(a,1),-1,min(1920,ih))'" -t 90 -c:a aac -b:a 320k -movflags +faststart ${newFile}`,
      resolve,
      undefined,
      stats => onProgress?.(stats.getTime()),
    ),
  )

  const success = ReturnCode.isSuccess(await result.getReturnCode())

  if (success) {
    await FileSystem.deleteAsync(file)
    const res = await FileSystem.getInfoAsync(newFile, {size: true})
    if (res.exists) {
      console.log('compressed size', (res.size / 1024 / 1024).toFixed(2) + 'mb')

      return {
        success,
        video: {uri: newFile, size: res.size} as CompressedVideo,
      }
    } else {
      throw new Error('Could not find output video')
    }
  } else {
    return {success: false}
  }
}