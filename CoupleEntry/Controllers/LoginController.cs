using CoupleEntry;
using CoupleEntry.Models;
using System;
using System.Web;
using System.Web.Mvc;
using static CoupleEntry.SessionService;

namespace UxWeb.Controllers
{
    public class LoginController : Controller
    {

        [HttpGet]
        public ActionResult Login()
        {
            RemoveCookiesAndSession();
            return View();
        }

        [HttpPost]
        public ActionResult Login(LoginModel loginModel)
        {

            if (loginModel != null)
            {
                SetProperty(SessionVariableNames.Login_Model, loginModel);
                SetProperty(SessionVariableNames.Email_Id, loginModel.Email);
                bool exists = DALayer.IsEmailPresentInDB(loginModel.Email);
                if (exists)
                {
                    DALayer.UpsertTokenValue(loginModel.Token, loginModel.Email);
                    DALayer.UpdateImageUrl(loginModel.Email, loginModel.ImageUrl);
                    int userId = DALayer.GetUserInfo(loginModel.Email).UserId;
                    SetCookies(loginModel, userId);
                    return Json(new { result = "Redirect", url = Url.Action("Index", "Home") }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { result = "Add", url = Url.Action("AddUserDetails", "Login", JsonRequestBehavior.AllowGet) });
                }

            }

            return Json(new { result = "Error" }, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult AddUserDetails()
        {
            User userModel = GetProperty(SessionVariableNames.Current_User) as User;
            if (userModel != null)
                return RedirectToAction("Index", "Home");
            LoginModel model = GetProperty(SessionVariableNames.Login_Model) as LoginModel;
            return View(model);
        }

        [HttpPost]
        public ActionResult AddUserToDB(LoginModel model)
        {

            User userDetails = DALayer.AddNewUser(model);
            DALayer.UpsertTokenValue(model.Token, model.Email);
            SetCookies(model, userDetails.UserId);
            SetProperty(SessionVariableNames.Current_User, userDetails);
            return RedirectToAction("Index", "Home");
        }

        private void SetCookies(LoginModel loginModel, int userId)
        {
            HttpCookie AuthCookie = new HttpCookie("Authorization", loginModel.Token);
            AuthCookie.Expires = DateTime.Now.AddSeconds(loginModel.Expiry);
            Response.Cookies.Add(AuthCookie);

            HttpCookie EmailCookie = new HttpCookie("UserMail", loginModel.Email);
            EmailCookie.Expires = DateTime.Now.AddSeconds(loginModel.Expiry);
            Response.Cookies.Add(EmailCookie);


            HttpCookie UserIdCookie = new HttpCookie("UserId", userId.ToString());
            UserIdCookie.Expires = DateTime.Now.AddSeconds(loginModel.Expiry);
            Response.Cookies.Add(UserIdCookie);

            HttpCookie AuthTypeCookie = new HttpCookie("AuthType", loginModel.AuthType);
            AuthTypeCookie.Expires = DateTime.Now.AddSeconds(loginModel.Expiry);
            Response.Cookies.Add(AuthTypeCookie);

        }
        private void RemoveCookiesAndSession()
        {
            if (Request.Cookies["Authorization"] != null)
            {
                var c = new HttpCookie("Authorization");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }
            if (Request.Cookies["UserMail"] != null)
            {
                var c = new HttpCookie("UserMail");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }
            if (Request.Cookies["UserId"] != null)
            {
                var c = new HttpCookie("UserId");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }
            if (Request.Cookies["AuthType"] != null)
            {
                var c = new HttpCookie("AuthType");
                c.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(c);
            }
            Session.Clear();
        }
    }
}