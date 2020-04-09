using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace SOH_LaunchPad_Web
{
    public static class StringExtension
    {
        // This is the extension method.
        // The first parameter takes the "this" modifier
        // and specifies the type for which the method is defined.
        public static string TrimAndReduce(this string str)
        {
            return str.TrimEnd(new char[] { '\n', '\r' }).TrimStart(new char[] { ' ' });
        }

        public static string RemoveSpecialCharacters(this string str)
        {
            StringBuilder sb = new StringBuilder();
            foreach (char c in str)
            {
                if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c == '.' || c == '_' || c == ' ' || c == '-')
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }
    }
}