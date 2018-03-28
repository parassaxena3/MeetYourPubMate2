using System;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Threading.Tasks;
using CoupleEntry.Models;
using System.Collections.Generic;
using CoupleEntry;

namespace SignalRChat
{
    public class ChatHub : Hub
    {
        public void Send(Message message)
        {

            string toUserId = null;
            if (LoggedInUsers.Users.ContainsKey(message.ToUserId))
                toUserId = LoggedInUsers.Users[message.ToUserId];
            if (toUserId != null)
            {
                Clients.Client(toUserId).addNewMessageToPage(message);
            }
        }

        public void SendNotification(string author, string message)
        {
            Clients.All.showTyping(author);
        }
        public override Task OnConnected()
        {
            string uid = Context.ConnectionId;
            HttpCookie cookie = HttpContext.Current.Request.Cookies["UserId"];
            if (cookie != null)
            {
                int userId = Convert.ToInt32(cookie.Value);
                if (!LoggedInUsers.Users.ContainsKey(userId) && !LoggedInUsers.Users.ContainsValue(uid))
                {
                    LoggedInUsers.Users.Add(userId, uid);
                }
                else
                {
                    LoggedInUsers.Users[userId] = uid;
                }
            }
            // Clients.All.addCurrentUsers(LoggedInUsers.Users);
            return base.OnConnected();
        }
        public override Task OnReconnected()
        {
            string uid = Context.ConnectionId;
            HttpCookie cookie = HttpContext.Current.Request.Cookies["UserId"];
            if (cookie != null)
            {
                int userId = Convert.ToInt32(cookie.Value);
                if (!LoggedInUsers.Users.ContainsKey(userId) && !LoggedInUsers.Users.ContainsValue(uid))
                {
                    LoggedInUsers.Users.Add(userId, uid);
                }
                else
                {
                    LoggedInUsers.Users[userId] = uid;
                }
            }
            return base.OnReconnected();
        }
        public override Task OnDisconnected(bool stopCalled)
        {
            string uid = Context.ConnectionId;
            int userId = KeyByValue(LoggedInUsers.Users, uid);
            DALayer.UpdateLastSeen(userId);
            if (LoggedInUsers.Users.ContainsKey(userId))
            {
                //Clients.All.removeUsers(uid);
                LoggedInUsers.Users.Remove(userId);
            }
            return base.OnDisconnected(stopCalled);
        }


        public static int KeyByValue(Dictionary<int, string> dict, string val)
        {
            int key = -1;
            foreach (KeyValuePair<int, string> pair in dict)
            {
                if (pair.Value == val)
                {
                    key = pair.Key;
                    break;
                }
            }
            return key;
        }

    }
}