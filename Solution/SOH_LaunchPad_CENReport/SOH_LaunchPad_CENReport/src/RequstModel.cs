using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;

namespace SOH_LaunchPad_CENReport
{
    public class RequstModel
    {
        public string ReportName;
        public List<ReportSelection> Selection;

        public RequstModel()
        {
            Selection = new List<ReportSelection>();
        }

        public void UpdateSelectionByRestriction(string userid)
        {
            List<ReportSelection> newList = new List<ReportSelection>();

            foreach (ReportSelection rs in Selection)
            {
                List<ReportSelection> updatelist = rs.FilterByRestriction(ReportName, userid);
                foreach (ReportSelection newRS in updatelist)
                {
                    newList.Add(newRS);
                }
            }

            Selection = newList;
        }
    }

    public class ReportSelection
    {
        public string SelName;
        public string Kind;
        public string Sign;
        public string SelOption;
        public string Low;
        public string High;


        public List<ReportSelection> FilterByRestriction(string reportname, string userid)
        {
            List<ReportSelection> list = new List<ReportSelection>();

            var restrictList = Common.GetRestrictListBySelName(SelName, reportname, userid);
            if(restrictList == null)
            {
                list.Add(this);
            }
            else
            {
                if(SelOption == "EQ")
                {
                    if (restrictList.Contains(this.Low))
                    {
                        list.Add(this);
                    }
                    else
                    {
                        this.Low = "XX";
                        list.Add(this);
                    }
                }
                else if(SelOption == "NE")
                {
                    foreach(string rstc in restrictList)
                    {
                        if (rstc != this.Low)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "BT")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) >= 0 && rstc.CompareTo(this.High) <= 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "NB")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) < 0 || rstc.CompareTo(this.High) > 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "GE")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) >= 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "GT")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) > 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "LE")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) <= 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "LT")
                {
                    foreach (string rstc in restrictList)
                    {
                        if (rstc.CompareTo(this.Low) < 0)
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "CP")
                {
                    string pattern = Common.WildCardToRegular(this.Low);

                    foreach (string rstc in restrictList)
                    {
                        if (Regex.IsMatch(rstc, pattern))
                        {
                            list.Add(GetNewEQ(rstc));
                        }
                    }
                }
                else if (SelOption == "")
                {
                    foreach (string rstc in restrictList)
                    {
                        list.Add(GetNewEQ(rstc));
                    }
                }
            }

            return list;
        }


        private ReportSelection GetNewEQ(string val)
        {
            ReportSelection rs = new ReportSelection();
            rs.SelName = SelName;
            rs.Kind = Kind;
            rs.Sign = Sign;
            rs.SelOption = "EQ";
            rs.Low = val;
            rs.High = "";

            return rs;
        }

    }

    public class ReportConfigs
    {
        public string ReportName;
        public List<ReportConfig> Configs;

        public ReportConfigs()
        {
            Configs = new List<ReportConfig>();
        }

        public void UpdateDependant()
        {
            foreach(var config in Configs)
            {
                if(config.MstSourceRef.Length > 0)
                {
                    var refItem = Configs.FirstOrDefault(t => t.MstSource == config.MstSourceRef);
                    if (refItem != null)
                        refItem.Dependant = config.SelName;
                }
            }
        }
    }

    public class ReportConfig
    {
        public string SelName;
        public string Kind;
        public string SelDesc;
        public string ControlType;
        public string RadioGroup;
        public string DefaultValue;
        public int IsMandatory;
        public string DataType;
        public int Length;
        public int Decimal;
        public string MstSource;
        public string MstSourceRef;
        public int IsMultipleSelect;
        public string Dependant;
        public int IsRestrict;
    }
}