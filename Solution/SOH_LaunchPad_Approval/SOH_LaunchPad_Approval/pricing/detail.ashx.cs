using System;
using System.IO;
using System.Data;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using SOH_LaunchPad_Approval.pricing.src;
using SOH_LaunchPad_Approval.common;
using System.Threading.Tasks;

namespace SOH_LaunchPad_Approval.pricing
{
    /// <summary>
    /// Summary description for detail
    /// </summary>
    public class detail : HttpTaskAsyncHandler
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
                var sono = HttpUtility.ParseQueryString(input).Get("SO");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string userid = tmp["LAN_ID"];
                    string approverid = userid;

                    DAO dao = new DAO();
                    var retDat = dao.GetDetail(sono);

                    PricingApproveDDS pdds = new PricingApproveDDS();
                    pdds.LoadFromDetail(retDat);
                    string retJson = JsonConvert.SerializeObject(pdds);

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

        public class PricingApproveDDS
        {
            public string MaterialNo { get; set; }
            public string CustomerStyleNo { get; set; }

            public DataTable Mat { get; set; }
            public DataTable MatGridValue { get; set; }
            public DataTable MatGridGroup { get; set; }
            public DataTable MatPO { get; set; }
            public List<DataTable> MatPOGridGroup { get; set; }
            public DataTable MatSO { get; set; }
            public List<DataTable> MatSOGridGroup { get; set; }

            public decimal ZCKB_Quotation { get; set; }
            public string ZCKB_Currency { get; set; }
            public string ZCKB_PER { get; set; }
            public string ZCKB_UOM { get; set; }

            public PricingApproveDDS()
            {
                ZCKB_Currency = "";
                ZCKB_PER = "";
                ZCKB_UOM = "";

                MatPOGridGroup = new List<DataTable>();
                MatSOGridGroup = new List<DataTable>();
            }

            public void LoadFromDetail(PricingApproveDetail detail)
            {
                if(detail.T_HEAD != null && detail.T_HEAD.Rows.Count > 0)
                {
                    MaterialNo = detail.T_HEAD.Rows[0]["VBELN"].ToString();
                    CustomerStyleNo = detail.T_HEAD.Rows[0]["BNAME"].ToString();
                }

                if (detail.T_ZCKB != null && detail.T_ZCKB.Rows.Count > 0)
                {
                    ZCKB_Quotation = decimal.Parse(detail.T_ZCKB.Rows[0]["KBETR"].ToString());
                    ZCKB_Currency = detail.T_ZCKB.Rows[0]["WAERS"].ToString();
                    ZCKB_PER = detail.T_ZCKB.Rows[0]["KPEIN"].ToString();
                    ZCKB_UOM = detail.T_ZCKB.Rows[0]["KMEIN"].ToString();
                }

                if (detail.T_DETAIL != null && detail.T_DETAIL.Rows.Count > 0)
                {
                    var rows_Mat = detail.T_DETAIL.Select("PRICE_TYPE = 903");
                    if(rows_Mat.Length > 0)
                    {
                        Mat = new DataTable();
                        Mat.Clear();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "KSCHL",
                            "KBETR",
                            "DATAB" };

                        foreach(var colname in colMappings)
                        {
                            Mat.Columns.Add(colname);
                        }

                        foreach(var row in rows_Mat)
                        {
                            List<object> objs = new List<object>();
                            foreach (var colname in colMappings)
                            {
                                objs.Add(row[colname]);
                            }
                            Mat.Rows.Add(objs.ToArray());
                        }
                    }

                    /* ############### */
                    var rows_MatGridValue = detail.T_DETAIL.Select("PRICE_TYPE = 902");
                    if (rows_MatGridValue.Length > 0)
                    {
                        MatGridValue = new DataTable();
                        MatGridValue.Clear();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "COLOR"
                        };

                        foreach (var row in rows_MatGridValue)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            if (!colMappings.Contains(size))
                                colMappings.Add(size);
                        }

                        foreach (var colname in colMappings)
                        {
                            MatGridValue.Columns.Add(colname);
                        }

                        foreach (var row in rows_MatGridValue)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            string color = row["J_3AENTX"].ToString();

                            var rows_SameColor = MatGridValue.Select($"COLOR = '{color}'");
                            if(rows_SameColor.Length > 0)
                            {
                                rows_SameColor[0][size] = row["KBETR"];
                            }
                            else
                            {
                                DataRow newRow = MatGridValue.NewRow();
                                newRow["TEXT"] = row["TEXT"];
                                newRow["KONWA"] = row["KONWA"];
                                newRow["KPEIN"] = row["KPEIN"];
                                newRow["KMEIN"] = row["KMEIN"];
                                newRow["COLOR"] = color;
                                newRow[size] = row["KBETR"];

                                MatGridValue.Rows.Add(newRow);
                            }
                        }
                    }

                    /* ############### */
                    var rows_MatGridGroup = detail.T_DETAIL.Select("PRICE_TYPE = 901");
                    if (rows_MatGridGroup.Length > 0)
                    {
                        MatGridGroup = new DataTable();
                        MatGridGroup.Clear();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "COLOR"
                        };

                        foreach (var row in rows_MatGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            if (!colMappings.Contains(size))
                                colMappings.Add(size);
                        }

                        foreach (var colname in colMappings)
                        {
                            MatGridGroup.Columns.Add(colname);
                        }

                        foreach (var row in rows_MatGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            string color = row["J_3AENTX"].ToString();

                            var rows_SameColor = MatGridGroup.Select($"COLOR = '{color}'");
                            if (rows_SameColor.Length > 0)
                            {
                                rows_SameColor[0][size] = row["KBETR"];
                            }
                            else
                            {
                                DataRow newRow = MatGridGroup.NewRow();
                                newRow["TEXT"] = row["TEXT"];
                                newRow["KONWA"] = row["KONWA"];
                                newRow["KPEIN"] = row["KPEIN"];
                                newRow["KMEIN"] = row["KMEIN"];
                                newRow["COLOR"] = color;
                                newRow[size] = row["KBETR"];

                                MatGridGroup.Rows.Add(newRow);
                            }
                        }
                    }


                    /* ############### */
                    var rows_MatPO = detail.T_DETAIL.Select("PRICE_TYPE = 913");
                    if (rows_MatPO.Length > 0)
                    {
                        MatPO = new DataTable();
                        MatPO.Clear();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "BSTKD",
                            "KBETR",
                            "DATAB" };

                        foreach (var colname in colMappings)
                        {
                            MatPO.Columns.Add(colname);
                        }

                        foreach (var row in rows_MatPO)
                        {
                            List<object> objs = new List<object>();
                            foreach (var colname in colMappings)
                            {
                                objs.Add(row[colname]);
                            }
                            MatPO.Rows.Add(objs.ToArray());
                        }
                    }

                    /* ############### */
                    var rows_MatPOGridGroup = detail.T_DETAIL.Select("PRICE_TYPE = 911");
                    if (rows_MatPOGridGroup.Length > 0)
                    {
                        Dictionary<string, DataTable> MatPOGridDict = new Dictionary<string, DataTable>();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "BSTKD",
                            "COLOR"
                        };

                        foreach (var row in rows_MatPOGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            if (!colMappings.Contains(size))
                                colMappings.Add(size);
                        }


                        foreach (var row in rows_MatPOGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            string color = row["J_3AENTX"].ToString();
                            string pono = row["BSTKD"].ToString();

                            DataTable table = null;
                            if(MatPOGridDict.ContainsKey(pono))
                            {
                                table = MatPOGridDict[pono];
                            }
                            else
                            {
                                table = new DataTable();
                                foreach (var colname in colMappings)
                                {
                                    table.Columns.Add(colname);
                                }
                                MatPOGridDict.Add(pono, table);
                            }

                            var rows_SameColor = table.Select($"COLOR = '{color}'");
                            if (rows_SameColor.Length > 0)
                            {
                                rows_SameColor[0][size] = row["KBETR"];
                            }
                            else
                            {
                                DataRow newRow = table.NewRow();
                                newRow["TEXT"] = row["TEXT"];
                                newRow["KONWA"] = row["KONWA"];
                                newRow["KPEIN"] = row["KPEIN"];
                                newRow["KMEIN"] = row["KMEIN"];
                                newRow["BSTKD"] = row["BSTKD"];
                                newRow["COLOR"] = color;
                                newRow[size] = row["KBETR"];

                                table.Rows.Add(newRow);
                            }
                        }

                        foreach(KeyValuePair<string, DataTable> p in MatPOGridDict)
                        {
                            MatPOGridGroup.Add(p.Value);
                        }
                    }

                    /* ############### */
                    var rows_MatSO = detail.T_DETAIL.Select("PRICE_TYPE = 922");
                    if (rows_MatSO.Length > 0)
                    {
                        MatSO = new DataTable();
                        MatSO.Clear();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "AUPOS",
                            "KBETR",
                            "DATAB" };

                        foreach (var colname in colMappings)
                        {
                            MatSO.Columns.Add(colname);
                        }

                        foreach (var row in rows_MatSO)
                        {
                            List<object> objs = new List<object>();
                            foreach (var colname in colMappings)
                            {
                                objs.Add(row[colname]);
                            }
                            MatSO.Rows.Add(objs.ToArray());
                        }
                    }


                    /* ############### */
                    var rows_MatSOGridGroup = detail.T_DETAIL.Select("PRICE_TYPE = 914");
                    if (rows_MatSOGridGroup.Length > 0)
                    {
                        Dictionary<string, DataTable> MatSOGridDict = new Dictionary<string, DataTable>();

                        List<string> colMappings = new List<string>() {
                            "TEXT",
                            "KONWA",
                            "KPEIN",
                            "KMEIN",
                            "AUPOS",
                            "COLOR"
                        };

                        foreach (var row in rows_MatSOGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            if (!colMappings.Contains(size))
                                colMappings.Add(size);
                        }

                        foreach (var row in rows_MatSOGridGroup)
                        {
                            string size = $"SSSZZZ{row["SIZE"].ToString()}";
                            string color = row["J_3AENTX"].ToString();
                            string soitem = row["AUPOS"].ToString();

                            DataTable table = null;
                            if (MatSOGridDict.ContainsKey(soitem))
                            {
                                table = MatSOGridDict[soitem];
                            }
                            else
                            {
                                table = new DataTable();
                                foreach (var colname in colMappings)
                                {
                                    table.Columns.Add(colname);
                                }
                                MatSOGridDict.Add(soitem, table);
                            }

                            var rows_SameColor = table.Select($"COLOR = '{color}'");
                            if (rows_SameColor.Length > 0)
                            {
                                rows_SameColor[0][size] = row["KBETR"];
                            }
                            else
                            {
                                DataRow newRow = table.NewRow();
                                newRow["TEXT"] = row["TEXT"];
                                newRow["KONWA"] = row["KONWA"];
                                newRow["KPEIN"] = row["KPEIN"];
                                newRow["KMEIN"] = row["KMEIN"];
                                newRow["AUPOS"] = row["AUPOS"];
                                newRow["COLOR"] = color;
                                newRow[size] = row["KBETR"];

                                table.Rows.Add(newRow);
                            }
                        }

                        foreach (KeyValuePair<string, DataTable> p in MatSOGridDict)
                        {
                            MatSOGridGroup.Add(p.Value);
                        }
                    }
                }

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