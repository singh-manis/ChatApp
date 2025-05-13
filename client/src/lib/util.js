
export function formatMessageTime(date) {
  return new Date(date).toLocaleDateString("in-India" , {
    hour:"2-digit",
    minute:"2-digit",
    hour12:false,

  })
}