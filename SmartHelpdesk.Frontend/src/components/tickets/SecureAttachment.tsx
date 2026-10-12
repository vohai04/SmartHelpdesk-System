import { useEffect, useState } from "react";
import { axiosClient } from "../../api/axiosClient";
import type { AttachmentDto } from "../../services/ticketService";
export function SecureAttachment({attachment}:{attachment:AttachmentDto}) {
  const [url,setUrl]=useState("");
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let disposed=false, objectUrl="";
    void (axiosClient.get(`/attachments/${attachment.id}/content`,{responseType:"blob"}) as unknown as Promise<Blob>).then(blob=>{
      if(disposed)return;
      objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);
    }).catch(()=>{if(!disposed)setFailed(true);});
    return ()=>{disposed=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[attachment.id]);
  return url?<a href={url} download={attachment.fileName} className="block rounded-lg border border-[var(--border-default)] p-2 text-xs">{attachment.contentType.startsWith("image/")?<img src={url} alt={attachment.fileName} className="h-20 object-cover max-w-[150px]"/>:attachment.fileName}</a>:<span className="text-xs">{failed?"Attachment unavailable":`Loading ${attachment.fileName}…`}</span>;
}
