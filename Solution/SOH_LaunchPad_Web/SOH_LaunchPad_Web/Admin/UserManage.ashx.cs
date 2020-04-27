using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace SOH_LaunchPad_Web.Admin
{
    /// <summary>
    /// Summary description for UserManage
    /// </summary>
    public class UserManage : HttpTaskAsyncHandler
    {
        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                try
                {
                    var token = HttpUtility.ParseQueryString(input).Get("Token");
                    var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");

                    RequestResult checkAuthRst = await Common.RequestUser(token, sysfuncid);
                    if (checkAuthRst.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(checkAuthRst.Errmsg);

                    var result = await GenericRequest.Post(Common.AuthWSEndpointUrl + "UserManage.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 400;
                    context.Response.StatusDescription = ex.Message;
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public override bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}