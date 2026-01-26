
import mongoose, { Document, Schema } from 'mongoose'

export interface IToxicUserMetric extends Document {
    author_id: string
    author_name: string
    author_image: string
    video_id: string
    toxic_count: number
    toxic_ratio: number
    total_comments: number
    window_start: Date
    window_end: Date
}

const ToxicUserMetricSchema: Schema = new Schema({
    author_id: { type: String, required: true }, // Not unique globally, but unique per video in logic usually
    author_name: { type: String, required: true },
    author_image: { type: String },
    video_id: { type: String, required: true, index: true },
    toxic_count: { type: Number, default: 0 },
    toxic_ratio: { type: Number, default: 0 },
    total_comments: { type: Number, default: 0 },
    window_start: { type: Date, required: true },
    window_end: { type: Date, required: true },
}, {
    timestamps: true
})


export const ToxicUserModel = mongoose.model<IToxicUserMetric>('ToxicUserMetric', ToxicUserMetricSchema, "toxic_user_metric")
