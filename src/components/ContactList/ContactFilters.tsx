import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TransparencyLevel } from '@/types/contact';
import { Badge } from "@/components/ui/badge";

interface ContactFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterTransparency: TransparencyLevel | 'all';
  onFilterTransparencyChange: (value: TransparencyLevel | 'all') => void;
  filterSubcategory: string;
  onFilterSubcategoryChange: (value: string) => void;
  filterCampaign: string;
  onFilterCampaignChange: (value: string) => void;
  campaigns: string[];
  showPersonalFilters: boolean;
  onAdvancedFilters?: () => void;
}

export function ContactFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterTransparency,
  onFilterTransparencyChange,
  filterSubcategory,
  onFilterSubcategoryChange,
  filterCampaign,
  onFilterCampaignChange,
  campaigns,
  showPersonalFilters,
  onAdvancedFilters
}: ContactFiltersProps) {
  return (
    <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-700 text-white border-gray-600"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onAdvancedFilters}
          className="bg-gray-700 hover:bg-gray-600 min-w-[140px]"
        >
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Contact Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Personal">
                <div className="flex items-center">
                  <span>Personal</span>
                  <Badge variant="secondary" className="ml-2">
                    {filterType === 'Personal' ? 'Active' : ''}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="Campaign">Campaign</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showPersonalFilters && (
          <>
            <div>
              <Select value={filterTransparency} onValueChange={onFilterTransparencyChange}>
                <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Transparency Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Full">Full Disclosure</SelectItem>
                  <SelectItem value="Partial">Partial Disclosure</SelectItem>
                  <SelectItem value="None">No Disclosure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filterSubcategory} onValueChange={onFilterSubcategoryChange}>
                <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Friends">Friends</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Stranger">Stranger</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {filterType === 'Campaign' && (
          <div>
            <Select value={filterCampaign} onValueChange={onFilterCampaignChange}>
              <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Select Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}