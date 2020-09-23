using System;
using System.Linq;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;
using System.Data.SqlClient;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for ImportFile
    /// </summary>
    public class ImportFile : IHttpHandler
    {
        public async void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var qid = HttpUtility.ParseQueryString(input).Get("QID");
                var filedata = HttpUtility.ParseQueryString(input).Get("FData");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string username = tmp["Username"];

                    ImportFileData fd = JsonConvert.DeserializeObject<ImportFileData>(filedata);

                    byte[] rawData = Convert.FromBase64String(fd.FileDataBase64);
                    List<SqlParameter> paras = new List<SqlParameter>();
                    var p = new SqlParameter("@filedata", SqlDbType.Binary, rawData.Length);
                    p.Value = rawData;
                    paras.Add(p);

                    SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                                $@"INSERT INTO [dbo].[SOH_Import_File]
                                                   ([SelectionID]
                                                   ,[FileName]
                                                   ,[FileType]
                                                   ,[FileData]
                                                   ,[CreatedOn]
                                                   ,[CreatedBy]) values
                            ('{qid}', '{fd.FileName}', '{fd.FileType}', @filedata, getdate(), '{username}')", paras.ToArray());



                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = new RequestResult(RequestResult.ResultStatus.Failure);
                    result.Errmsg = ex.Message;
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public class ImportFileData
        {
            public string FileName;
            public string FileDataBase64;

            public string FileType
            {
                get
                {
                    return FileName.IndexOf('.') > 0 ? FileName.Substring(FileName.IndexOf('.')) : "";
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