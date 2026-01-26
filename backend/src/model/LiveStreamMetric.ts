
import mongoose, { Document, Schema } from 'mongoose'

export interface ILiveStreamMetric extends Document {
    video_id: string
    window_start: Date
    window_end: Date
    total_comments: number
    toxic_count: number
    toxic_ratio: number
    unique_viewers: number
}

const LiveStreamMetricSchema: Schema = new Schema({
    video_id: { type: String, required: true, index: true },
    window_start: { type: Date, required: true },
    window_end: { type: Date, required: true },
    toxic_count: { type: Number, default: 0 },
    toxic_ratio: { type: Number, default: 0 },
    toxic_rate: { type: Number, default: 0 },
    unique_viewers: { type: Number, default: 0 }
}, {
    timestamps: true
})



export const MetricModel = mongoose.model<ILiveStreamMetric>('LiveStreamMetric', LiveStreamMetricSchema, "live_stream_metric")
