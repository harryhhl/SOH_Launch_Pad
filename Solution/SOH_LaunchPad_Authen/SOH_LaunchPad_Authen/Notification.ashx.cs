using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Helper;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for Notification
    /// </summary>
    public class Notification : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var username = inputset.Get("User");
                var nid = inputset.Get("NID");

                try
                {
                    if (action == "listsetting")
                    {
                        List<NotificationFunc> funcList = new List<NotificationFunc>();
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT [FunctionID],[Type],[Para] FROM [dbo].[NotificationSettings]");

                        for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                        {
                            var row = rcd.Tables[0].Rows[r];

                            string funcId = row["FunctionID"].ToString();
                            string type = row["Type"].ToString();
                            string para = row["Para"].ToString();
                            funcList.Add(new NotificationFunc() { FunctionID = funcId, Type = type, Para = para });
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(funcList)));
                    }
                    else if (action == "listcenter")
                    {
                        List<NotificationCenterMsg> msgList = new List<NotificationCenterMsg>();

                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT TOP 15 [Id]
                                ,[Username]
                                ,[Type]
                                ,[CreateDate]
                                ,[UpdateDate]
                                ,[Status]
                                ,[Para]
                            FROM [dbo].[NotificationCenter]
                            where [Username]='{username}' and [Status]>0 and [Type]=0
                            order by CreateDate desc");


                        for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                        {
                            var row = rcd.Tables[0].Rows[r];

                            NotificationCenterMsg msg = new NotificationCenterMsg();
                            msg.Id = row["Id"].ToString();
                            msg.Type = (int)row["Type"];
                            msg.Status = (int)row["Status"];
                            msg.Para = row["Para"].ToString();

                            msg.GetNotificationTitle();
                            msgList.Add(msg);
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(msgList)));

                    }
                    else if (action == "addnotification")
                    {
                        var qid = HttpUtility.ParseQueryString(input).Get("QID");

                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@QID", qid));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_InsNotificationCenterForReport", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "addnotificationEmail")
                    {
                        var qid = HttpUtility.ParseQueryString(input).Get("QID");

                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@QID", qid));
                        paras.Add(new SqlParameter("@Type", 1));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_InsNotificationCenterForReport", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "getpendingcount")
                    {
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT count(1) as [CountTotal] FROM [dbo].[NotificationCenter] where Username='{username}' and status=1 and [type]=0");

                        var row = rcd.Tables[0].Rows[0];
                        string count = row["CountTotal"].ToString();

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(count)));
                    }
                    else if (action == "markread")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@ID", nid));
                        paras.Add(new SqlParameter("@Status", 2));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateNotificationStatus", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "markreadall")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_SetNotificationStatusRead", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error("No Action is defined")));
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


        public class NotificationFunc
        {
            public string FunctionID;
            public string Type;
            public string Para;
        }

        public class NotificationCenterMsg
        {
            public string Id;
            public int Type;
            public int Status;
            public string Title;
            public string Para;

            public void GetNotificationTitle()
            {
                try
                {
                    if (Type == 0)
                    {
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT [ReportDisplayName] FROM [dbo].[SAPReportQueue] a left join [dbo].[SAPReportList] b 
                                on a.ReportName=b.ReportName where Id='{Para}'");

                        var row = rcd.Tables[0].Rows[0];
                        string reportname = row["ReportDisplayName"].ToString();

                        Title = string.Format("{0} is ready", reportname);
                    }
                }
                catch (Exception ex)
                {
                    Title = ex.Message;
                }
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}