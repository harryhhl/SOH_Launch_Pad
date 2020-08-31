using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for GetReportConfig
    /// </summary>
    public class GetReportConfig : IHttpHandler
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
                var rptname = HttpUtility.ParseQueryString(input).Get("Report");
                var tokenid = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");

                try
                {
                    List<string> restrictedNameList = Common.GetRestrictDisplaynameList();

                    DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                        $@"SELECT [ProgramID]
                              ,[SelName]
                              ,[Kind]
                              ,[DisplayName]
                              ,[ControlType]
                              ,[RadioGroup]
                              ,[DefaultValue]
                              ,convert(int, [IsMandatory]) as [IsMandatory]
                              ,[DataType]
                              ,[Length]
                              ,[Decimal]
                              ,convert(int, [IsMutipleSelection]) as [IsMutipleSelection]
                              ,a.[DataSourceID]
                              ,b.[DataSource] as [RefDataSoure]
                          FROM [dbo].[SOH_Selection_Config] a
                               left join [dbo].[SOH_Selection_DataSource] b on a.[DataSourceID] = b.[DataSourceID]
                          where ProgramID='{rptname}' order by ItemNo");

                    ReportConfigs configs = new ReportConfigs();
                    configs.ReportName = rptname;
                    if (rcd.Tables.Count > 0)
                    {
                        for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                        {
                            var row = rcd.Tables[0].Rows[r];
                            ReportConfig config = new ReportConfig();
                            config.SelName = row["SelName"].ToString().Trim();
                            config.Kind = row["Kind"].ToString().Trim();
                            config.SelDesc = row["DisplayName"].ToString().Trim();
                            config.ControlType = row["ControlType"].ToString().Trim();
                            config.RadioGroup = row["RadioGroup"].ToString().Trim();
                            config.DefaultValue = row["DefaultValue"].ToString().Trim();
                            config.IsMandatory = (int)row["IsMandatory"];
                            config.DataType = row["DataType"].ToString().Trim();
                            config.Length = (int)row["Length"];
                            config.Decimal = (int)row["Decimal"];
                            config.MstSource = row["DataSourceID"].ToString().Trim();
                            config.IsMultipleSelect = (int)row["IsMutipleSelection"];
                            config.MstSourceRef = row["RefDataSoure"].ToString().Trim();

                            if (config.SelDesc == "User ID(No Display)")
                            {
                                config.ControlType = "TextBox";

                                RequestResult result = await Common.RequestUsername(tokenid, sysfuncid);
                                if (result.Status == RequestResult.ResultStatus.Failure)
                                    throw new Exception(result.Errmsg);

                                var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                                config.DefaultValue = tmp["LAN_ID"];
                            }
                            else
                            {
                                if (config.Kind == "S" && config.ControlType.Trim().Length < 1)
                                    config.ControlType = "Range";

                                config.RadioGroup = config.RadioGroup.Replace(' ', '_');

                                if (config.MstSource != null && config.MstSource.Length > 1)
                                {
                                    if (config.IsMultipleSelect == 1)
                                        config.ControlType = "MultiSelectRange";
                                    else
                                        config.ControlType = "ComboBox";
                                }

                                if (restrictedNameList.Contains(config.SelDesc))
                                {
                                    config.IsRestrict = 1;
                                }
                            }                            

                            configs.Configs.Add(config);
                        }

                        configs.UpdateDependant();
                    }

                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(configs);
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

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}