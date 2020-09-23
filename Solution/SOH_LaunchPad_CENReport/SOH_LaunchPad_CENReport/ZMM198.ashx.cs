using System;
using System.Linq;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;
using static SOH_LaunchPad_CENReport.GetALVReportSchema;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for ZMM198
    /// </summary>
    public class ZMM198 : IHttpHandler
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

                var sysfuncid = inputset.Get("FuncID");
                var token = inputset.Get("Token");
                var action = inputset.Get("Action");
                var reportname = inputset.Get("Report");
                var qid = inputset.Get("QID");
                var PPCorPUR = inputset.Get("PPCorPUR");

                try
                {
                    if (action == "getdetailschema")
                    {
                        var gridConfig = GetConfigFromReportDB(reportname, qid, PPCorPUR);

                        RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                        ret.Data = JsonConvert.SerializeObject(gridConfig);
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(ret));
                    }
                    else if(action == "update")
                    {
                        var models = inputset.Get("models");
                        UpdateDetailTable(qid, models);

                        RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                        ret.Data = "";
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(ret));
                    }
                    else
                    {
                        throw new Exception("Action not defined.");
                    }
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

        public static void UpdateDetailTable(string qid, string updatemodels)
        {
            var models = JsonConvert.DeserializeObject<List<GenericJsonObj>>(updatemodels);

            for (int i = 0; i < models.Count; i++)
            {
                var model = models[i];
                string countID = "";
                List<string> listSetta = new List<string>();
                foreach (var property in model)
                {
                    if (property.Key == "count")
                    {
                        countID = Convert.ToString(property.Value);
                    }
                    else
                    {
                        if(property.Value != null)
                            listSetta.Add($@"[{property.Key}]='{property.Value}'");
                    }
                }

                if (countID.Length > 0)
                {
                    var ret = SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                            $@"UPDATE [dbo].[ZRMM198_Detail] SET {string.Join(",", listSetta)} where [SelectionID]='{qid}' and count='{countID}'");
                }
            }
        }

        public static KendoGridConfig GetConfigFromReportDB(string reportname, string qid, string PPCorPUR)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                             $@"SELECT a.COLUMN_NAME, 
                                       a.DATA_TYPE, 
                                       a.DATA_LENGTH, 
                                       isnull(b.EXTENDEDPROPERTYVALUE, '') AS COLUMN_TITLE 
                                FROM   (SELECT COLUMN_NAME, 
                                               DATA_TYPE, 
                                               Isnull(CHARACTER_MAXIMUM_LENGTH, 0) AS DATA_LENGTH, 
                                               ORDINAL_POSITION 
                                        FROM   information_schema.columns 
                                        WHERE  TABLE_NAME = '{reportname}' 
                                               AND COLUMN_NAME <> 'SelectionID' 
                                               AND COLUMN_NAME <> 'CreatedOn') a 
                                       LEFT JOIN 
                                       (SELECT clmns.NAME AS ColumnName, 
                                                Cast(p.VALUE AS SQL_VARIANT) AS ExtendedPropertyValue 
                                        FROM   sys.tables AS tbl 
                                                INNER JOIN sys.all_columns AS clmns 
                                                        ON clmns.OBJECT_ID = tbl.OBJECT_ID 
                                                INNER JOIN sys.extended_properties AS p 
                                                        ON p.MAJOR_ID = tbl.OBJECT_ID 
                                                        AND p.MINOR_ID = clmns.COLUMN_ID 
                                                        AND p.CLASS = 1 
                                        WHERE  tbl.NAME = '{reportname}') b 
                                    ON a.COLUMN_NAME = b.COLUMNNAME 
                                 ORDER  BY ORDINAL_POSITION ASC ");

            KendoGridSchemaSetting schema = new KendoGridSchemaSetting();
            List<KendoGridColumnSetting> settings = new List<KendoGridColumnSetting>();

            var colLengthDS = GetColumnMaxDataLength(reportname, qid);
            var fieldconfigs = GetKendoFieldConfig(PPCorPUR);
            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                string columnname = row["COLUMN_NAME"].ToString();
                string datatype = row["DATA_TYPE"].ToString();
                int datalength = (int)row["DATA_LENGTH"];
                string title = row["COLUMN_TITLE"].ToString().Trim();

                datalength = colLengthDS == null ? datalength : colLengthDS[columnname];
                string new_columnname = Common.KendoSaveChar(columnname);

                bool isHide = false;
                bool isEdit = false;
                var fieldconf = fieldconfigs.FirstOrDefault(f => f.ColumnName.ToUpper() == columnname.ToUpper());
                if (fieldconf != null)
                {
                    isHide = fieldconf.IsHide;
                    isEdit = fieldconf.IsEdit;
                }

                if (isHide == false)
                {
                    schema.Add(new_columnname, datatype, isEdit);
                    settings.Add(KendoGridColumnSetting.Create(new_columnname, title, datatype, datalength));
                }
            }

            KendoGridConfig config = new KendoGridConfig();
            config.SchemaSetting = schema.GetSchemaString();
            config.ColumnSetting = JsonConvert.SerializeObject(settings);

            return config;
        }

        public static List<KendoFieldConfig> GetKendoFieldConfig(string PPCorPUR)
        {
            List<KendoFieldConfig> configs = new List<KendoFieldConfig>();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                     $@"SELECT [TechnicalName]
                              ,[IsPPCHide]
                              ,[IsPurHide]
                              ,[IsPPCEdit]
                              ,[IsPUREdit]
                          FROM [dbo].[ZRMM198_Field_Config]
                          where IsPPCEdit=1 or IsPurHide=1 or IsPPCHide=1 or IsPUREdit=1");

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                var ColumnName = row["TechnicalName"].ToString();
                var IsPPCHide = (bool)(row["IsPPCHide"]);
                var IsPurHide = (bool)(row["IsPurHide"]);
                var IsPPCEdit = (bool)(row["IsPPCEdit"]);
                var IsPUREdit = (bool)(row["IsPUREdit"]);

                KendoFieldConfig conf = new KendoFieldConfig();
                conf.ColumnName = ColumnName;
                if (PPCorPUR == "P_RADPUR")
                {
                    conf.IsHide = IsPurHide;
                    conf.IsEdit = IsPUREdit;
                }

                configs.Add(conf);
            }

            return configs;
        }


        public class KendoFieldConfig
        {
            public string ColumnName;
            public bool IsHide;
            public bool IsEdit;
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