using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using SOH_LaunchPad_Approval.po.src;
using SOH_LaunchPad_Approval.common;
using System.Threading.Tasks;

namespace SOH_LaunchPad_Approval.po
{
    /// <summary>
    /// Summary description for list
    /// </summary>
    public class list : HttpTaskAsyncHandler
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
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var approver = HttpUtility.ParseQueryString(input).Get("Approver");
                var data = HttpUtility.ParseQueryString(input).Get("Data");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string userid = tmp["LAN_ID"];
                    string approverid = userid;

                    if (approver.Length > 1)
                    {
                        List<string> actingList = GetActingApprover.GetActingApproverList(userid, sysfuncid);
                        if (actingList.Contains(approver))
                            approverid = approver;
                    }

                    var inputData = JsonConvert.DeserializeObject<DAO.POApprovalDisplayRequestModel>(data);
                    inputData.I_USERNAME = approverid;
                    DAO dao = new DAO();
                   
                    //if (dao.CheckReleaseAuth(approverid, inputData.Get("SONo"), inputData.Get("Vendor")) == false)
                    //{
                    //    throw new Exception("You have No Access Rights for this SO! ");
                    //}

                    var retDat = dao.List(inputData);
                    string retJson = JsonConvert.SerializeObject(retDat);

                    RequestResult ret = RequestResult.Create(RequestResult.ResultStatus.Success, retJson, "");

                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = RequestResult.Error(ex.Message);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }

                context.Response.StatusCode = 200;
                context.Response.StatusDescription = "OK";
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