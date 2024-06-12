import {useState} from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {compressVideo} from '#/lib/media/video/compress'

export function useVideoState({setError}: {setError: (error: string) => void}) {
  const {_} = useLingui()
  const [progress, setProgress] = useState(0)

  const {mutate, data, isPending, isError, reset, variables} = useMutation({
    mutationFn: async (asset: ImagePickerAsset) => {
      console.log(
        'uncompressed size',
        ((asset.fileSize ?? 0) / 1024 / 1024).toFixed(2) + 'mb',
      )
      const compressed = await compressVideo(asset.uri, {
        onProgress: progressMs => {
          if (asset.duration) {
            setProgress(progressMs / asset.duration)
          }
        },
      })

      return compressed
    },
    onError: error => {
      console.error('error', error)
      setError(_(msg`Could not compress video`))
    },
    onMutate: () => {
      setProgress(0)
    },
  })

  return {
    video: data?.video,
    onSelectVideo: mutate,
    videoPending: isPending,
    videoProcessingData: variables,
    videoError: isError,
    clearVideo: reset,
    videoProcessingProgress: progress,
  }
}