export interface IStreamListResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  pollingIntervalMillis: number;
  offlineAt: Date;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: ILiveChatMessageResourceResponse[];
  activePollItem: ILiveChatMessageResourceResponse;
}

export interface ILiveChatMessageResourceResponse {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    type: string;
    liveChatId: string;
    authorChannelId: string;
    publishedAt: Date;
    hasDisplayContent: boolean;
    displayMessage: string;
    textMessageDetails: {
      messageText: string;
    };
    messageDeletedDetails: {
      deletedMessageId: string;
    };
    userBannedDetails: {
      bannedUserDetails: {
        channelId: string;
        channelUrl: string;
        displayName: string;
        profileImageUrl: string;
      };
      banType: string;
      banDurationSeconds: number;
    };
    memberMilestoneChatDetails: {
      userComment: string;
      memberMonth: number;
      memberLevelName: string;
    };
    newSponsorDetails: {
      memberLevelName: string;
      isUpgrade: boolean;
    };
    superChatDetails: {
      amountMicros: number;
      currency: string;
      amountDisplayString: string;
      userComment: string;
      tier: number;
    };
    superStickerDetails: {
      superStickerMetadata: {
        stickerId: string;
        altText: string;
        language: string;
      };
      amountMicros: number;
      currency: string;
      amountDisplayString: string;
      tier: number;
    };
    pollDetails: {
      metadata: {
        options: {
          optionText: string;
          tally: string;
        };
        questionText: string;
        status: string;
      };
    };
    membershipGiftingDetails: {
      giftMembershipsCount: number;
      giftMembershipsLevelName: string;
    };
    giftMembershipReceivedDetails: {
      memberLevelName: string;
      gifterChannelId: string;
      associatedMembershipGiftingMessageId: string;
    };
  };
  authorDetails: {
    channelId: string;
    channelUrl: string;
    displayName: string;
    profileImageUrl: string;
    isVerified: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isChatModerator: boolean;
  };
}
export enum MessageType {
  CHAT = "CHAT", // Tin nhắn bình thường
  DELETED = "DELETED", // Tin nhắn bị xóa
}

export interface IYoutubeComment {
  message: string;
  authorId: string;
  authorImage: string;
  authorName: string;
  timestamp: string;
  isModerator: boolean;
}
export interface KafkaPayload {
  type: MessageType;
  commentId: string; // ID của comment (hoặc ID bị xóa)
  videoId: string;
  data: IYoutubeComment | { timestamp: string }; // Dữ liệu comment hoặc ID bị xóa
}
