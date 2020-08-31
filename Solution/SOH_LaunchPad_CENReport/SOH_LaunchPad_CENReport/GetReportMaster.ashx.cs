using System;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for GetReportMaster
    /// </summary>
    public class GetReportMaster : IHttpHandler
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
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var mastername = HttpUtility.ParseQueryString(input).Get("MstName");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string username = tmp["Username"];
                    string userid = tmp["LAN_ID"];

                    var listRestricted = Common.GetRestrictedMasterList(mastername, "MstTable", userid);
                    DataSet rcd_schema = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                                $@"select top 3 COLUMN_NAME, DATA_TYPE, isnull(CHARACTER_MAXIMUM_LENGTH, 0) as DATA_LENGTH
                                from INFORMATION_SCHEMA.COLUMNS
                                where TABLE_NAME='{mastername}' and COLUMN_NAME<>'EDIOn'
                                order by ORDINAL_POSITION asc");


                    string col_code = rcd_schema.Tables[0].Rows[0]["COLUMN_NAME"].ToString();
                    string col_descp = rcd_schema.Tables[0].Rows[1]["COLUMN_NAME"].ToString();
                    string col_ref = "null";
                    if (rcd_schema.Tables[0].Rows.Count > 2)
                        col_ref = rcd_schema.Tables[0].Rows[2]["COLUMN_NAME"].ToString();

                   DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                        $@"SELECT {col_code} as [Code], {col_descp} as [Description], {col_ref} as [RefCode]
                          FROM [dbo].[{mastername}] where len({col_code})>0 order by {col_code} asc;");

                    MasterDataSet mds = new MasterDataSet();
                    for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                    {
                        var row = rcd.Tables[0].Rows[r];

                        MasterData item = new MasterData();
                        item.Code = row["Code"].ToString().Trim();
                        item.Description = row["Description"].ToString().Trim();
                        item.RefCode = row["RefCode"].ToString().Trim();

                        if (listRestricted == null || listRestricted.Contains(item.Code))
                            mds.Add(item);
                    }

                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(mds);
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

                context.Response.StatusCode = 200;
                context.Response.StatusDescription = "OK";
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }


        class MasterData
        {
            public string Code;
            public string Description;
            public string RefCode;
        }

        class MasterDataSet
        {
            public List<MasterData> ListData;
            public int TotalCount = 0;

            public MasterDataSet()
            {
                ListData = new List<MasterData>();
            }

            public void Add(MasterData data)
            {
                ListData.Add(data);
                TotalCount += 1;
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