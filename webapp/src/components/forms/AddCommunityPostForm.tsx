import React from "react";

import { AddPostForm } from "./AddPostForm";

type AddCommunityPostFormProps = {
  communityId: string;
  communityName: string;
  publisherName: string;
};

export const AddCommunityPostForm = ({
  communityId,
  communityName,
  publisherName,
}: AddCommunityPostFormProps) => {
  return (
    <AddPostForm
      communityId={communityId}
      contextTitle={`Создание поста в ${communityName} от ${publisherName}`}
    />
  );
};
