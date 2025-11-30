export class CompanyResponseDto {
  static toResponse(company) {
    return {
      companyName: company.companyName,
      description: company.description,
      industry: company.industry,
      address: company.address,
      numberOfEmployees: company.numberOfEmployees,
      companyEmail: company.companyEmail,
      createdBy: company.createdBy,
      logo: company.logo,
      coverPic: company.coverPic,
      // legalAttachment: company.legalAttachment,
    };
  }
}
